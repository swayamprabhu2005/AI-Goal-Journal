from fastapi import APIRouter, Depends, status
from app.core.auth import get_current_user, AuthenticatedUser
from app.schemas.summary import WeeklySummaryResponse
from app.services.summary_service import summary_service

router = APIRouter(prefix="/summaries", tags=["Summaries"])

@router.get("/weekly", response_model=WeeklySummaryResponse)
def get_weekly_summary(current_user: AuthenticatedUser = Depends(get_current_user)):
    """
    Retrieve the latest generated weekly accountability coaching summary.
    If no summary exists yet, generates a fresh baseline summary.
    """
    summary = summary_service.get_latest_summary(user_id=current_user.uid)
    if not summary:
        summary = summary_service.generate_weekly_summary(
            user_id=current_user.uid,
            user_name=current_user.name or "",
        )
    return summary

@router.post("/weekly", response_model=WeeklySummaryResponse, status_code=status.HTTP_201_CREATED)
def generate_weekly_summary(current_user: AuthenticatedUser = Depends(get_current_user)):
    """
    Generate a fresh on-demand weekly accountability summary synthesizing
    recent journal entries, goal status evolutions, and recurring blockers.
    """
    return summary_service.generate_weekly_summary(
        user_id=current_user.uid,
        user_name=current_user.name or "",
    )
