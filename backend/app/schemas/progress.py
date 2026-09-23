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


class ProgressHistoryItem(ProgressResponse):
    change_from_previous: int = Field(
        0,
        description="Change in percentage points compared to the previous update"
    )


class ProgressTrendResponse(BaseModel):
    goal_id: str
    goal_title: Optional[str] = None
    current_progress: int
    initial_progress: int
    net_change: int
    average_progress_change: float = Field(
        0.0,
        description="Average progress change between consecutive recorded updates "
        "(2 decimal places); excludes the baseline record.",
    )
    stagnant_updates: int = Field(
        0,
        description="Number of updates where the progress value did not change from the "
        "previous recorded value (baseline excluded).",
    )
    period_days: Optional[int] = Field(
        None,
        description="Number of recent days used for period progress gain, or null when no "
        "period was requested.",
    )
    period_progress_gain: int = Field(
        0,
        description="Net progress gain over the requested period (or over the whole history "
        "when no period is given).",
    )
    trend_direction: str = Field(
        ...,
        description="Trend direction: improving, stagnant, or declining"
    )
    total_updates: int
    history: list[ProgressHistoryItem] = Field(
        default_factory=list,
        description="Complete progress updates ordered chronologically"
    )