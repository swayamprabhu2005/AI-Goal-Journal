from fastapi import APIRouter, Depends, HTTPException, status
from app.core.auth import get_current_user, AuthenticatedUser
from app.schemas.user import UserProfileResponse, UserProfileUpdate
from app.services.user_service import user_service
from app.services.productivity_service import productivity_service

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserProfileResponse)
@router.get("/me/", response_model=UserProfileResponse, include_in_schema=False)
def get_my_profile(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Retrieve profile and productivity stats for the authenticated user."""
    return user_service.get_or_create_profile(
        uid=current_user.uid,
        email=current_user.email,
        name=current_user.name,
    )

@router.get("/me/productivity-score")
@router.get("/me/productivity-score/", include_in_schema=False)
def get_my_productivity_score(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Calculate deterministic Personal Productivity Score (0-100) for authenticated user."""
    return productivity_service.calculate_user_productivity_score(user_id=current_user.uid)

@router.put("/me", response_model=UserProfileResponse)
@router.put("/me/", response_model=UserProfileResponse, include_in_schema=False)
def update_my_profile(
    data: UserProfileUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Update profile information for the authenticated user."""
    updated = user_service.update_profile(uid=current_user.uid, data=data)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found",
        )
    return updated

@router.put("/me/preferences", response_model=UserProfileResponse)
def update_my_preferences(
    preferences: dict,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Update preference flags for the authenticated user."""
    updated = user_service.update_preferences(uid=current_user.uid, preferences=preferences)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found",
        )
    return updated