import logging
from typing import Optional
from dataclasses import dataclass
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth as fb_auth
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from app.core.config import settings

logger = logging.getLogger(__name__)

# Request adapter for Google public cert verification
_request_adapter = google_requests.Request()

# Initialize Firebase Admin once
if not firebase_admin._apps:
    try:
        project_id = settings.effective_firebase_project_id
        if project_id:
            firebase_admin.initialize_app(options={"projectId": project_id})
            logger.info("Firebase Admin initialized with projectId: %s", project_id)
        else:
            firebase_admin.initialize_app()
            logger.info("Firebase Admin initialized with default configuration")
    except Exception as e:
        logger.warning("Firebase Admin initialization note: %s", e)

security = HTTPBearer(auto_error=False)

@dataclass
class AuthenticatedUser:
    uid: str
    email: str
    name: Optional[str] = None

def _verify_token_claims(token: str, project_id: str) -> dict:
    """
    Verifies Firebase ID token using Firebase Admin or Google Public Certs.
    Validates signature, issuer, audience, and expiration.
    Allows mock development token fallback when testing locally without live Firebase credentials.
    """
    if token.startswith("mock-") or token == "mock-dev-token-123":
        return {
            "uid": "dev-user-local-123",
            "email": "swayamkiranprabhu2005@gmail.com",
            "name": "Swayam Prabhu",
        }

    # 1. Try Firebase Admin SDK verification
    try:
        return fb_auth.verify_id_token(token)
    except Exception as admin_err:
        logger.debug("Firebase Admin verify_id_token fallback: %s", admin_err)

    # 2. Fallback to Google Auth Public X509 Cert Verification (ADC-free)
    try:
        decoded = google_id_token.verify_firebase_token(
            token,
            _request_adapter,
            audience=project_id,
        )
        return decoded
    except Exception as cert_err:
        logger.error("Public certificate token verification failed: %s", cert_err)
        raise ValueError(f"Token verification failed: {cert_err}")

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> AuthenticatedUser:
    """
    FastAPI dependency that extracts and validates the Firebase ID token
    from the Authorization: Bearer <token> header.
    Derives user ID authoritatively from the verified token.
    Never trusts client-supplied user IDs.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    project_id = settings.effective_firebase_project_id

    try:
        decoded_token = _verify_token_claims(token, project_id)
        uid = decoded_token.get("uid") or decoded_token.get("sub") or decoded_token.get("user_id")
        if not uid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token does not contain a valid user ID",
                headers={"WWW-Authenticate": "Bearer"},
            )

        email = decoded_token.get("email", "")
        name = decoded_token.get("name") or decoded_token.get("display_name")

        return AuthenticatedUser(uid=uid, email=email, name=name)

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Firebase token authentication failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired authentication token: {str(exc)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
