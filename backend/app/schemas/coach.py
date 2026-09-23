from typing import Optional, Any
from pydantic import BaseModel, Field

class CoachChatMessage(BaseModel):
    role: str = Field(..., description="Role of the sender: user or assistant")
    content: str = Field(..., description="Message text")

class CoachChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="User's message to the AI coach")
    history: Optional[list[CoachChatMessage]] = Field(default=None, description="Previous conversation turns")

class CoachChatResponse(BaseModel):
    reply: str
    model: str
    usage: Optional[dict[str, Any]] = None
