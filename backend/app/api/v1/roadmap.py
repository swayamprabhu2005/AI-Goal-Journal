from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.auth import get_current_user, AuthenticatedUser
from app.schemas.roadmap import RoadmapGenerateRequest, RoadmapResponse
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/roadmap", tags=["Roadmap"])

from app.services.roadmap_service import roadmap_service

@router.post("/generate", response_model=RoadmapResponse, status_code=status.HTTP_200_OK)
def generate_roadmap(
    data: RoadmapGenerateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Generate an AI-powered structured learning/achievement roadmap for a goal.
    Returns 4-8 ordered milestones with action items and durations.
    """
    if not data.goal_title or not data.goal_title.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Goal title is required to generate a roadmap",
        )

    if data.goal_id:
        return roadmap_service.get_or_create_roadmap(
            user_id=current_user.uid,
            goal_id=data.goal_id,
            goal_title=data.goal_title.strip(),
            timeline=data.timeline or "Self-paced",
            level=data.level or "Beginner",
        )

    return gemini_service.generate_goal_roadmap(
        goal_title=data.goal_title.strip(),
        timeline=data.timeline or "Self-paced",
        level=data.level or "Beginner",
        goal_id=data.goal_id,
    )

@router.get("/sample", response_model=RoadmapResponse)
def get_sample_roadmap():
    """
    Get a sample roadmap payload for UI development and testing.
    """
    return gemini_service.generate_goal_roadmap(
        goal_title="Learn Frontend Development",
        timeline="10-12 weeks",
        level="Beginner",
    )
