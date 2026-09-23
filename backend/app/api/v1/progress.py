from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.auth import get_current_user, AuthenticatedUser
from app.schemas.progress import (
    ProgressCreate,
    ProgressResponse,
    ProgressTrendResponse,
    ProgressHistoryItem,
)
from app.services.progress_service import progress_service


router = APIRouter(
    prefix="/progress",
    tags=["Progress"]
)


@router.post(
    "",
    response_model=ProgressResponse,
    status_code=status.HTTP_201_CREATED,
)
@router.post(
    "/",
    response_model=ProgressResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
def create_progress(
    data: ProgressCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    if not data.goal_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="goal_id is required",
        )

    try:
        return progress_service.create_progress(
            user_id=current_user.uid,
            goal_id=data.goal_id,
            progress_value=data.progress_value,
            note=data.note,
        )

    except LookupError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )


@router.get(
    "/goal/{goal_id}",
    response_model=list[ProgressResponse],
)
def get_progress_history(
    goal_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    return progress_service.get_progress_history(
        user_id=current_user.uid,
        goal_id=goal_id,
    )


@router.get(
    "/goal/{goal_id}/trend",
    response_model=ProgressTrendResponse,
)
def get_progress_trend(
    goal_id: str,
    days: Optional[int] = Query(
        None,
        ge=1,
        le=365,
        description="Number of recent days for period-based progress gain (1-365).",
    ),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    try:
        return progress_service.get_progress_trend(
            user_id=current_user.uid,
            goal_id=goal_id,
            days=days,
        )
    except LookupError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )


@router.get(
    "/goal/{goal_id}/latest",
    response_model=ProgressResponse,
)
def get_latest_progress(
    goal_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    progress = progress_service.get_latest_progress(
        user_id=current_user.uid,
        goal_id=goal_id,
    )

    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Progress record not found",
        )

    return progress