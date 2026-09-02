from fastapi import APIRouter, Depends
from datetime import datetime, timezone, timedelta
from app.schemas.productivity import ProductivityScoreResponse
from app.services.productivity_service import ProductivityScoreService
from app.core.auth import get_current_user, AuthenticatedUser
from app.repositories.in_memory import goal_repo, journal_repo

router = APIRouter(prefix="/productivity-score", tags=["Productivity"])

@router.get("", response_model=ProductivityScoreResponse)
def get_productivity_score(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    # 1. Fetch user's goals
    goals = goal_repo.get_all_by_user(user_id=current_user.uid)

    # 2. Fetch user's journals from the last 7 days
    user_journals = journal_repo.get_all_by_user(user_id=current_user.uid)
    recent_journals = []
    for j in user_journals:
        c_at = j.created_at
        if c_at.tzinfo is None:
            c_at = c_at.replace(tzinfo=timezone.utc)
        if c_at >= seven_days_ago:
            recent_journals.append(j)

    # 3. Compute deterministic score
    return ProductivityScoreService.compute_score(
        goals=goals,
        recent_journals=recent_journals
    )