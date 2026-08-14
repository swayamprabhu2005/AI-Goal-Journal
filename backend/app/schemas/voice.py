from pydantic import BaseModel

class VoiceTranscribeResponse(BaseModel):
    transcript: str
    duration_seconds: float = 0.0
    language: str = "en"
