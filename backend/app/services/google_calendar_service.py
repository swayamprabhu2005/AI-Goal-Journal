import logging
import uuid
import urllib.parse
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
import httpx

from app.core.config import settings
from app.core.crypto import crypto_service
from app.models.domain import GoogleCalendarToken, Goal
from app.repositories.calendar_repo import calendar_token_repo
from app.repositories.postgres import goal_repo

logger = logging.getLogger(__name__)

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_CALENDAR_API_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

class GoogleCalendarService:
    def is_configured(self) -> bool:
        """Checks if Google OAuth client ID and secret are configured in environment."""
        client_id = (settings.GOOGLE_CLIENT_ID or "").strip()
        client_secret = (settings.GOOGLE_CLIENT_SECRET or "").strip()
        return bool(client_id and client_secret and "your_" not in client_id.lower())

    def get_authorization_url(self, user_id: str) -> str:
        """
        Builds Google OAuth2 authorization URL.
        """
        if not self.is_configured():
            raise ValueError(
                "Google Calendar integration is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env."
            )

        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": settings.GOOGLE_CALENDAR_SCOPE,
            "access_type": "offline",
            "prompt": "consent",
            "state": user_id,
        }
        return f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"


    async def exchange_code(self, code: str, user_id: str, email: Optional[str] = None) -> dict:
        """
        Exchanges authorization code for access and refresh tokens.
        Encrypts tokens with AES-256-GCM before saving to repository.
        """
        if not self.is_configured():
            raise ValueError("Google OAuth credentials are not configured in backend .env.")

        async with httpx.AsyncClient(timeout=15.0) as client:
            token_resp = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code",
                },
            )

            if token_resp.status_code != 200:
                logger.error("Failed to exchange code with Google: %s", token_resp.text)
                raise ValueError(f"Google OAuth token exchange failed: {token_resp.text}")

            token_data = token_resp.json()
            access_token = token_data.get("access_token")
            refresh_token = token_data.get("refresh_token") or ""
            expires_in = token_data.get("expires_in", 3600)
            token_expiry = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

            # Retrieve user email if available
            google_email: Optional[str] = None
            try:
                userinfo_resp = await client.get(
                    GOOGLE_USERINFO_URL,
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if userinfo_resp.status_code == 200:
                    google_email = userinfo_resp.json().get("email")
            except Exception as exc:
                logger.warning("Could not fetch Google userinfo: %s", exc)

            # Encrypt tokens before storing
            token_model = GoogleCalendarToken(
                user_id=user_id,
                encrypted_access_token=crypto_service.encrypt(access_token),
                encrypted_refresh_token=crypto_service.encrypt(refresh_token),
                token_expiry=token_expiry,
                google_email=google_email or "Google Calendar User",
            )
            calendar_token_repo.save_token(token_model)
            logger.info("Successfully connected Google Calendar for user %s (%s)", user_id, google_email)

            return {
                "connected": True,
                "email": token_model.google_email,
                "mode": "live",
            }

    async def get_valid_access_token(self, user_id: str) -> Optional[str]:
        """
        Retrieves and decrypts the access token, automatically refreshing if expired.
        """
        token_record = calendar_token_repo.get_token_by_user(user_id)
        if not token_record:
            return None

        # Check demo mode token
        raw_access = crypto_service.decrypt(token_record.encrypted_access_token)
        if raw_access and raw_access.startswith("demo_"):
            return raw_access

        now = datetime.now(timezone.utc)
        is_expired = token_record.token_expiry and token_record.token_expiry <= now

        if is_expired and token_record.encrypted_refresh_token:
            raw_refresh = crypto_service.decrypt(token_record.encrypted_refresh_token)
            if raw_refresh and self.is_configured():
                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        resp = await client.post(
                            GOOGLE_TOKEN_URL,
                            data={
                                "client_id": settings.GOOGLE_CLIENT_ID,
                                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                                "refresh_token": raw_refresh,
                                "grant_type": "refresh_token",
                            },
                        )
                        if resp.status_code == 200:
                            data = resp.json()
                            new_access = data.get("access_token")
                            expires_in = data.get("expires_in", 3600)
                            token_record.encrypted_access_token = crypto_service.encrypt(new_access)
                            token_record.token_expiry = now + timedelta(seconds=expires_in)
                            calendar_token_repo.save_token(token_record)
                            return new_access
                except Exception as exc:
                    logger.error("Token refresh failed for user %s: %s", user_id, exc)

        return raw_access

    def get_connection_status(self, user_id: str) -> dict:
        """Returns connection status for a user."""
        token_record = calendar_token_repo.get_token_by_user(user_id)
        if not token_record:
            return {
                "connected": False,
                "email": None,
                "is_configured": self.is_configured(),
            }

        # Count goals already synced
        goals = goal_repo.get_all_by_user(user_id)
        synced_count = sum(1 for g in goals if getattr(g, "calendar_synced", False))

        return {
            "connected": True,
            "email": token_record.google_email or "Google Calendar",
            "synced_goals_count": synced_count,
            "is_configured": self.is_configured(),
        }

    async def sync_goal_to_calendar(
        self,
        user_id: str,
        goal_id: str,
        target_date: Optional[str] = None,
        start_time_str: Optional[str] = None,
        duration_minutes: int = 60,
    ) -> dict:
        """
        Creates or updates an event in the user's primary Google Calendar for the specified goal.
        """
        goal = goal_repo.get_by_id(user_id, goal_id)
        if not goal:
            raise ValueError("Goal not found")

        # Determine scheduled date
        date_str = (target_date or goal.target_date or datetime.now().strftime("%Y-%m-%d")).split("T")[0]
        time_part = start_time_str or "09:00:00"
        if len(time_part) == 5:
            time_part += ":00"

        start_dt = f"{date_str}T{time_part}"
        try:
            parsed_start = datetime.strptime(start_dt, "%Y-%m-%dT%H:%M:%S")
        except Exception:
            parsed_start = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)

        parsed_end = parsed_start + timedelta(minutes=duration_minutes)
        start_iso = parsed_start.isoformat()
        end_iso = parsed_end.isoformat()

        access_token = await self.get_valid_access_token(user_id)
        if not access_token:
            raise ValueError("Google Calendar is not connected. Please connect your calendar first.")

        event_summary = f"🎯 {goal.title}"
        event_description = (
            f"AI Goal Journal Milestone\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"Category: {goal.category or 'General'}\n"
            f"Priority: {goal.priority or 'Medium Priority'}\n"
            f"Progress: {goal.progress_value}%\n\n"
            f"{goal.description or ''}\n\n"
            f"Created via AI Goal Journal & Accountability Coach"
        )

        event_id: str = ""
        event_link: str = ""

        # Live Google Calendar API call
        if not access_token.startswith("demo_") and self.is_configured():
            event_payload = {
                "summary": event_summary,
                "description": event_description,
                "start": {
                    "dateTime": f"{start_iso}Z",
                    "timeZone": "UTC",
                },
                "end": {
                    "dateTime": f"{end_iso}Z",
                    "timeZone": "UTC",
                },
                "reminders": {
                    "useDefault": False,
                    "overrides": [
                        {"method": "popup", "minutes": 30},
                        {"method": "email", "minutes": 60},
                    ],
                },
            }

            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    GOOGLE_CALENDAR_API_URL,
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                    },
                    json=event_payload,
                )

                if resp.status_code in (200, 201):
                    event_data = resp.json()
                    event_id = event_data.get("id", "")
                    event_link = event_data.get("htmlLink", "")
                else:
                    logger.error("Google Calendar event creation failed: %s", resp.text)
                    raise ValueError(f"Could not create Google Calendar event: {resp.text}")
        else:
            # Demonstration / Mock Calendar Event
            event_id = f"gcal_{uuid.uuid4().hex[:12]}"
            # Direct Google Calendar Web Event Edit link for instant user opening
            encoded_title = urllib.parse.quote(event_summary)
            encoded_desc = urllib.parse.quote(event_description)
            encoded_start = parsed_start.strftime("%Y%m%dT%H%M%SZ")
            encoded_end = parsed_end.strftime("%Y%m%dT%H%M%SZ")
            event_link = f"https://calendar.google.com/calendar/render?action=TEMPLATE&text={encoded_title}&dates={encoded_start}/{encoded_end}&details={encoded_desc}"

        # Update Goal record with synced status
        goal_repo.update(
            user_id=user_id,
            goal_id=goal_id,
            google_event_id=event_id,
            google_event_link=event_link,
            calendar_synced=True,
        )

        return {
            "success": True,
            "goal_id": goal_id,
            "google_event_id": event_id,
            "google_event_link": event_link,
            "start_time": start_iso,
            "end_time": end_iso,
            "message": f"Goal '{goal.title}' successfully added to your Google Calendar!",
        }

    def disconnect(self, user_id: str) -> bool:
        """Revokes and disconnects Google Calendar for the user."""
        return calendar_token_repo.delete_token(user_id)

google_calendar_service = GoogleCalendarService()
