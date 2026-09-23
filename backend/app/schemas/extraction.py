"""
app/schemas/extraction.py

The consistent, validated structure Gemini's response must match.

This is intentionally simpler than the Day 2 research schema (which had
mood/activities-with-status/goal-matching fields). Day 4's target shape,
per this iteration's task, is the flatter:

{
  "goals": [{"title": "...", "status": "Active"}],
  "completed_activities": ["..."],
  "blockers": ["..."]
}

Using Pydantic means we get free validation: if Gemini's JSON is missing
a field, has the wrong type, or invents a status value outside the
allowed set, model_validate() raises immediately instead of bad data
silently flowing into the database.
"""

from typing import Literal
from pydantic import BaseModel, Field, ConfigDict

GoalStatus = Literal["Active", "Completed", "Stalled"]


class Goal(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1)
    status: GoalStatus


class ExtractionResult(BaseModel):
    """
    The validated, consistent AI response shape.

    Fields are intentionally required (no defaults) rather than
    defaulting to []. The prompt already instructs Gemini to always
    include all three keys (using [] where nothing applies) — if a key
    is missing entirely, that's a sign of a malformed/incomplete
    response, and we want validation to catch it rather than silently
    treat "key missing" the same as "explicitly empty".
    """

    model_config = ConfigDict(extra="forbid")

    goals: list[Goal]
    completed_activities: list[str]
    blockers: list[str]