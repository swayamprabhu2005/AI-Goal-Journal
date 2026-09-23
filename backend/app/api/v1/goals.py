from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.auth import get_current_user, AuthenticatedUser
from app.schemas.goal import GoalCreate, GoalUpdate, GoalResponse, FocusNextResponse
from app.schemas.progress import ProgressCreate, ProgressResponse
from app.schemas.roadmap import RoadmapResponse
from app.services.goal_service import goal_service
from app.services.progress_service import progress_service
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/goals", tags=["Goals"])

@router.get("", response_model=list[GoalResponse])
@router.get("/", response_model=list[GoalResponse], include_in_schema=False)
def list_goals(
    status: Optional[str] = Query(None, description="Filter goals by status: Active, Completed, Stalled"),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """List all goals belonging to the authenticated user."""
    return goal_service.list_goals(user_id=current_user.uid, status=status)

@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=GoalResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_goal(
    data: GoalCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Create a new goal for the authenticated user."""
    return goal_service.create_goal(user_id=current_user.uid, data=data)

@router.get("/focus-next", response_model=Optional[FocusNextResponse])
def get_focus_next_recommendation(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get the highest-priority goal recommendation and next actionable step."""
    return goal_service.get_focus_next_recommendation(user_id=current_user.uid)

@router.get("/{goal_id}", response_model=GoalResponse)
def get_goal(
    goal_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Retrieve a specific goal by ID."""
    goal = goal_service.get_goal(user_id=current_user.uid, goal_id=goal_id)
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )
    return goal

@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: str,
    data: GoalUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Update goal attributes or status."""
    updated = goal_service.update_goal(user_id=current_user.uid, goal_id=goal_id, data=data)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )
    return updated

@router.delete("/{goal_id}", status_code=status.HTTP_200_OK)
def delete_goal(
    goal_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Delete a goal."""
    deleted = goal_service.delete_goal(user_id=current_user.uid, goal_id=goal_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )
    return {"message": "Goal deleted successfully", "id": goal_id}

@router.post("/{goal_id}/progress", response_model=ProgressResponse, status_code=status.HTTP_201_CREATED)
def record_goal_progress(
    goal_id: str,
    data: ProgressCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Record progress (0-100%) for a goal."""
    progress = progress_service.record_progress(user_id=current_user.uid, goal_id=goal_id, data=data)
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )
    return progress

@router.get("/{goal_id}/progress", response_model=list[ProgressResponse])
def get_goal_progress_history(
    goal_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get progress history for a goal."""
    return progress_service.get_progress_history(user_id=current_user.uid, goal_id=goal_id)

from app.services.roadmap_service import roadmap_service

@router.post("/{goal_id}/roadmap", response_model=RoadmapResponse)
@router.get("/{goal_id}/roadmap", response_model=RoadmapResponse)
def get_or_generate_goal_roadmap(
    goal_id: str,
    timeline: Optional[str] = Query("Self-paced"),
    level: Optional[str] = Query("Beginner"),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Generate or retrieve a structured learning roadmap for an existing goal."""
    goal = goal_service.get_goal(user_id=current_user.uid, goal_id=goal_id)
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )
    return roadmap_service.get_or_create_roadmap(
        user_id=current_user.uid,
        goal_id=goal_id,
        goal_title=goal.title,
        timeline=timeline or "Self-paced",
        level=level or "Beginner",
    )

@router.post("/{goal_id}/roadmap/milestones/{step_number}/toggle", response_model=RoadmapResponse)
@router.put("/{goal_id}/roadmap/milestones/{step_number}/toggle", response_model=RoadmapResponse)
def toggle_roadmap_milestone(
    goal_id: str,
    step_number: int,
    completed: Optional[bool] = Query(None),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Toggle or set milestone completion status for a goal roadmap."""
    updated = roadmap_service.toggle_milestone(
        user_id=current_user.uid,
        goal_id=goal_id,
        step_number=step_number,
        completed=completed,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap or milestone not found",
        )
    return updated

