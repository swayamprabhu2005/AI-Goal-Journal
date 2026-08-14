from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.auth import get_current_user, AuthenticatedUser
from app.schemas.goal import GoalCreate, GoalUpdate, GoalResponse
from app.services.goal_service import goal_service

router = APIRouter(prefix="/goals", tags=["Goals"])

@router.get("", response_model=list[GoalResponse])
def list_goals(
    status: Optional[str] = Query(None, description="Filter goals by status: Active, Completed, Stalled"),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """List all goals belonging to the authenticated user."""
    return goal_service.list_goals(user_id=current_user.uid, status=status)

@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    data: GoalCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Create a new goal for the authenticated user."""
    return goal_service.create_goal(user_id=current_user.uid, data=data)

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
