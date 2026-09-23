from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

class Milestone(BaseModel):
    step_number: int = Field(..., description="Ordered 1-based step index of the milestone")
    title: str = Field(..., description="Clear, concise milestone title")
    short_description: str = Field(..., description="Brief summary of tasks and focus area")
    estimated_duration: str = Field("1 week", description="Estimated duration (e.g., '1-2 weeks', '3 days')")
    key_action_item: str = Field(..., description="Concrete action item or capstone objective")
    completed: bool = Field(False, description="Completion status of this milestone")

class RoadmapGenerateRequest(BaseModel):
    goal_id: Optional[str] = Field(None, description="Optional associated goal ID")
    goal_title: str = Field(..., min_length=1, max_length=200, description="Title/objective of the goal")
    timeline: Optional[str] = Field("Self-paced", description="Preferred pacing (e.g. 'Self-paced', '4 weeks', '2 months')")
    level: Optional[str] = Field("Beginner", description="Target proficiency level (e.g. 'Beginner', 'Intermediate', 'Advanced')")

class RoadmapResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    goal_id: Optional[str] = None
    goal_title: str
    total_milestones: int
    estimated_total_duration: str
    milestones: List[Milestone]
    completed_count: int = 0
    progress_percentage: int = 0
    created_at: Optional[str] = None
