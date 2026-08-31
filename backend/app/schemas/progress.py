from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ProgressCreate(BaseModel):
    # Optional because some routes provide goal_id in the URL/path.
    goal_id: Optional[str] = None

    progress_value: int = Field(
        ...,
        ge=0,
        le=100,
        description="Progress percentage from 0 to 100"
    )

    note: Optional[str] = Field(
        None,
        description="Optional note or reflection detailing progress"
    )


class ProgressUpdate(BaseModel):
    progress_value: Optional[int] = Field(
        None,
        ge=0,
        le=100
    )

    note: Optional[str] = None


class ProgressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    goal_id: str
    progress_value: int
    note: Optional[str] = None
    created_at: datetime