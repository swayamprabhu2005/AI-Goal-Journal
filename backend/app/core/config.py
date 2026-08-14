import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Root directory of the project
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
ENV_FILE = ROOT_DIR / ".env"

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.exists() else None,
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Gemini AI
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.1-flash-lite"

    # Firebase
    FIREBASE_PROJECT_ID: str = ""
    VITE_FIREBASE_PROJECT_ID: str = ""

    # Whisper
    WHISPER_MODEL: str = "tiny"
    WHISPER_DEVICE: str = "cpu"
    WHISPER_COMPUTE_TYPE: str = "int8"

    # API / Server
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "AI Goal Journal & Accountability Coach"
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @property
    def effective_firebase_project_id(self) -> str:
        return self.FIREBASE_PROJECT_ID or self.VITE_FIREBASE_PROJECT_ID

settings = Settings()
