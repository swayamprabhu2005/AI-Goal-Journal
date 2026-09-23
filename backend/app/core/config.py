"""
app/core/config.py
Central configuration and environment settings for AI Goal Journal: Growth Workspace.
"""

import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

# Root directory of the project: AI-GOAL-JOURNAL/
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
ENV_FILE = ROOT_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.exists() else None,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Project metadata
    PROJECT_NAME: str = "AI Goal Journal: Growth Workspace"
    API_V1_PREFIX: str = "/api/v1"

    # Gemini AI Configuration
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.1-flash-lite"
    GEMINI_MODEL_NAME: str = "gemini-3.1-flash-lite"
    EXTRACTION_TEMPERATURE: float = 0.0
    MAX_REPAIR_ATTEMPTS: int = 1

    # Groq Conversational AI Coach
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"

    # Cryptography & Security
    ENCRYPTION_KEY: str = "ai-goal-journal-default-secret-dev-key-change-in-prod"
    ENCRYPTION_OLD_KEYS: str = ""

    # Firebase Authentication
    FIREBASE_PROJECT_ID: str = ""
    VITE_FIREBASE_PROJECT_ID: str = ""

    # Speech-to-Text (faster-whisper)
    WHISPER_MODEL: str = "tiny"
    WHISPER_DEVICE: str = "cpu"
    WHISPER_COMPUTE_TYPE: str = "int8"

    # Database & Persistence
    DATABASE_URL: str = ""

    # CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    @property
    def effective_firebase_project_id(self) -> str:
        return self.FIREBASE_PROJECT_ID or self.VITE_FIREBASE_PROJECT_ID


settings = Settings()

# Top-level module exports for backwards compatibility
GEMINI_API_KEY = settings.GEMINI_API_KEY
GEMINI_MODEL_NAME = settings.GEMINI_MODEL_NAME or settings.GEMINI_MODEL
EXTRACTION_TEMPERATURE = settings.EXTRACTION_TEMPERATURE
MAX_REPAIR_ATTEMPTS = settings.MAX_REPAIR_ATTEMPTS
