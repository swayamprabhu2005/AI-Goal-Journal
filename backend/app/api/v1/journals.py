from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from app.core.auth import get_current_user, AuthenticatedUser
from app.schemas.journal import JournalCreate, JournalUpdate, JournalResponse
from app.schemas.voice import VoiceTranscribeResponse
from app.services.journal_service import journal_service
from app.services.whisper_service import whisper_service

router = APIRouter(prefix="/journals", tags=["Journals"])

@router.get("", response_model=list[JournalResponse])
def list_journals(current_user: AuthenticatedUser = Depends(get_current_user)):
    """List all journals for the authenticated user (newest first)."""
    return journal_service.list_journals(user_id=current_user.uid)

@router.post("", response_model=JournalResponse, status_code=status.HTTP_201_CREATED)
def create_journal(
    data: JournalCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Create a new journal entry. Automatically invokes Gemini AI extraction
    to derive mood, activities (completed vs ongoing vs planned), blockers,
    and goal associations.
    """
    if not data.content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Journal content cannot be empty",
        )
    return journal_service.create_journal(user_id=current_user.uid, data=data)

@router.get("/{journal_id}", response_model=JournalResponse)
def get_journal(
    journal_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Retrieve a single journal entry by ID."""
    entry = journal_service.get_journal(user_id=current_user.uid, journal_id=journal_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal entry not found",
        )
    return entry

@router.put("/{journal_id}", response_model=JournalResponse)
def update_journal(
    journal_id: str,
    data: JournalUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Update journal content."""
    updated = journal_service.update_journal(
        user_id=current_user.uid, journal_id=journal_id, data=data
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal entry not found",
        )
    return updated

@router.delete("/{journal_id}", status_code=status.HTTP_200_OK)
def delete_journal(
    journal_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Delete a journal entry."""
    deleted = journal_service.delete_journal(user_id=current_user.uid, journal_id=journal_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal entry not found",
        )
    return {"message": "Journal entry deleted successfully", "id": journal_id}

@router.post("/voice/transcribe", response_model=VoiceTranscribeResponse)
async def transcribe_voice(
    file: UploadFile = File(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Transcribe audio upload using the local faster-whisper Tiny model on CPU.
    Validates audio format, runs transcription, and deletes temporary files.
    """
    # Validate file size (< 15 MB)
    MAX_SIZE = 15 * 1024 * 1024
    audio_bytes = await file.read()

    if not audio_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded audio file is empty",
        )

    if len(audio_bytes) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Audio file exceeds 15 MB limit",
        )

    filename = file.filename or "recording.webm"

    try:
        transcript, duration, language = whisper_service.transcribe_audio_bytes(
            audio_bytes=audio_bytes,
            original_filename=filename,
        )
        return VoiceTranscribeResponse(
            transcript=transcript,
            duration_seconds=duration,
            language=language,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech transcription failed: {str(e)}",
        )
