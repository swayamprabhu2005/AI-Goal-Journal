from fastapi import APIRouter, Depends, HTTPException, status
from app.core.auth import get_current_user, AuthenticatedUser
from app.schemas.coach import CoachChatRequest, CoachChatResponse
from app.services.groq_service import groq_service

router = APIRouter(prefix="/coach", tags=["Coach"])

@router.post("/chat", response_model=CoachChatResponse)
@router.post("/chat/", response_model=CoachChatResponse, include_in_schema=False)
def chat_with_coach(
    payload: CoachChatRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Two-way conversational AI coaching endpoint powered by Groq Cloud,
    grounded with user's live goals, habits, streaks, and recent emotional reflections
    from the 10-Class Neural Mood Analyzer.
    """
    if not payload.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty",
        )

    history = [m.model_dump() for m in payload.history] if payload.history else None
    result = groq_service.chat(
        user_id=current_user.uid,
        message=payload.message.strip(),
        conversation_history=history,
    )

    return CoachChatResponse(
        reply=result.get("reply", ""),
        model=result.get("model", "unknown"),
        usage=result.get("usage"),
    )
