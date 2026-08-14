from fastapi import APIRouter, Depends, HTTPException, status
from app.core.auth import get_current_user, AuthenticatedUser
from app.schemas.user import UserProfileResponse, UserProfileUpdate
from app.services.user_service import user_service

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserProfileResponse)
def get_my_profile(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Retrieve profile and productivity stats for the authenticated user."""
    return user_service.get_or_create_profile(
        uid=current_user.uid,
        email=current_user.email,
        name=current_user.name,
    )

@router.put("/me", response_model=UserProfileResponse)
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