"""
app/core/config.py
"""

import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-3.5-flash-lite")

EXTRACTION_TEMPERATURE = 0.0

# How many times to retry with a repair prompt if Gemini's response
# fails JSON parsing or schema validation.
MAX_REPAIR_ATTEMPTS = 1

if not GEMINI_API_KEY:
    raise EnvironmentError(
        "GEMINI_API_KEY is not set. Copy .env.example to .env and add your "
        "key from Google AI Studio (https://aistudio.google.com/apikey)."
    )
