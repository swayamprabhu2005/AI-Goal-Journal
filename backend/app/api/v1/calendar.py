import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field

from app.core.auth import get_current_user, AuthenticatedUser
from app.core.config import settings
from app.services.google_calendar_service import google_calendar_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/calendar", tags=["Google Calendar"])

class SyncGoalRequest(BaseModel):
    goal_id: str = Field(..., description="ID of the goal to sync to Google Calendar")
    target_date: Optional[str] = Field(None, description="Optional custom target date (YYYY-MM-DD)")
    start_time: Optional[str] = Field(None, description="Optional start time (HH:MM)")
    duration_minutes: Optional[int] = Field(60, ge=15, le=480, description="Duration in minutes")

@router.get("/auth-url")
def get_auth_url(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Returns the Google OAuth 2.0 authorization URL for connecting calendar."""
    is_conf = google_calendar_service.is_configured()
    if not is_conf:
        return {
            "auth_url": None,
            "is_configured": False,
            "user_email": current_user.email,
            "message": "Google Calendar integration is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file."
        }
    try:
        auth_url = google_calendar_service.get_authorization_url(user_id=current_user.uid)
        return {
            "auth_url": auth_url,
            "is_configured": True,
            "user_email": current_user.email,
        }
    except Exception as exc:
        logger.error("Failed to generate Google OAuth auth url: %s", exc)
        return {
            "auth_url": None,
            "is_configured": False,
            "user_email": current_user.email,
            "message": str(exc),
        }

@router.get("/callback")
async def oauth_callback(
    code: str = Query(..., description="OAuth authorization code returned by Google"),
    state: Optional[str] = Query(None, description="State containing user_id"),
):
    """
    Google OAuth redirect callback endpoint.
    Exchanges code for tokens and redirects back to the frontend workspace.
    """
    user_id = state or "anonymous"
    try:
        await google_calendar_service.exchange_code(code=code, user_id=user_id)
        redirect_target = f"{settings.FRONTEND_URL}/calendar?calendar_connected=success"
    except Exception as exc:
        logger.error("OAuth callback error for user %s: %s", user_id, exc)
        redirect_target = f"{settings.FRONTEND_URL}/calendar?calendar_connected=error"

    return RedirectResponse(url=redirect_target, status_code=status.HTTP_307_TEMPORARY_REDIRECT)

@router.get("/status")
def get_calendar_status(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Returns the Google Calendar connection status for the current user."""
    status_data = google_calendar_service.get_connection_status(user_id=current_user.uid)
    status_data["user_email"] = current_user.email
    return status_data

@router.post("/sync-goal")
async def sync_goal(
    payload: SyncGoalRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Schedules a specific goal or milestone on the user's primary Google Calendar.
    """
    try:
        result = await google_calendar_service.sync_goal_to_calendar(
            user_id=current_user.uid,
            goal_id=payload.goal_id,
            target_date=payload.target_date,
            start_time_str=payload.start_time,
            duration_minutes=payload.duration_minutes or 60,
        )
        return result
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception as exc:
        logger.error("Failed to sync goal %s to calendar: %s", payload.goal_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to synchronize goal to Google Calendar.",
        )

@router.delete("/disconnect")
def disconnect_calendar(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Disconnects Google Calendar for the authenticated user."""
    google_calendar_service.disconnect(user_id=current_user.uid)
    return {"success": True, "message": "Google Calendar disconnected."}
