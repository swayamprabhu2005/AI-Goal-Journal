from fastapi import APIRouter, Depends, status
from app.core.auth import get_current_user, AuthenticatedUser
from app.schemas.summary import WeeklySummaryResponse
from app.services.summary_service import summary_service

router = APIRouter(prefix="/summaries", tags=["Summaries"])

@router.get("/weekly", response_model=WeeklySummaryResponse)
@router.get("/weekly/", response_model=WeeklySummaryResponse, include_in_schema=False)
def get_weekly_summary(current_user: AuthenticatedUser = Depends(get_current_user)):
    """
    Retrieve the latest generated weekly accountability coaching summary.
    If no summary exists yet, returns a fast default baseline summary.
    """
    summary = summary_service.get_latest_summary(user_id=current_user.uid)
    if not summary:
        from app.models.domain import WeeklySummary
        from datetime import datetime
        import uuid
        return WeeklySummary(
            id=str(uuid.uuid4()),
            user_id=current_user.uid,
            headline="Welcome to your Weekly AI Accountability Journal",
            wins=["Started daily journal reflections"],
            recurring_blockers=[],
            goal_status_changes=[],
            mood_trend="positive",
            coaching_suggestion="Log daily reflections to generate personalized AI coaching insights.",
            created_at=datetime.utcnow(),
        )
    return summary

@router.post("/weekly", response_model=WeeklySummaryResponse, status_code=status.HTTP_201_CREATED)
@router.post("/weekly/", response_model=WeeklySummaryResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def generate_weekly_summary(current_user: AuthenticatedUser = Depends(get_current_user)):
    """
    Generate a fresh on-demand weekly accountability summary synthesizing
    recent journal entries, goal status evolutions, and recurring blockers.
    """
    return summary_service.generate_weekly_summary(
        user_id=current_user.uid,
        user_name=current_user.name or "",
    )
