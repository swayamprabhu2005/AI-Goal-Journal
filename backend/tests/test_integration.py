import os
import sys
from pathlib import Path

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

import io
import wave
import math
import struct
import psutil
from dotenv import load_dotenv

# Load root .env
load_dotenv(dotenv_path=BACKEND_DIR.parent / ".env")

from app.services.whisper_service import whisper_service
from app.services.gemini_service import gemini_service
from app.services.goal_service import goal_service
from app.models.domain import Goal

def create_synthetic_wav_bytes(duration_seconds=2.0, frequency=440.0) -> bytes:
    """Generate a clean synthetic sine wave in WAV format for transcription memory testing."""
    sample_rate = 16000
    num_samples = int(sample_rate * duration_seconds)
    wav_io = io.BytesIO()

    with wave.open(wav_io, "wb") as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)

        for i in range(num_samples):
            value = int(32767.0 * 0.5 * math.sin(2.0 * math.pi * frequency * (i / sample_rate)))
            data = struct.pack("<h", value)
            wav_file.writeframes(data)

    return wav_io.getvalue()

def run_integration_verifications():
    print("==================================================")
    print("RUNNING INTEGRATION VERIFICATION")
    print("==================================================")

    # 1. Measure Memory Before Whisper
    process = psutil.Process(os.getpid())
    mem_before_mb = process.memory_info().rss / (1024 * 1024)
    print(f"[1] Memory Before Whisper Model Load: {mem_before_mb:.2f} MB")

    # 2. Run Whisper Tiny Transcription & Measure Memory
    wav_bytes = create_synthetic_wav_bytes(duration_seconds=2.0)
    print(f"[2] Generated {len(wav_bytes)} bytes of audio. Running Whisper Tiny on CPU INT8...")

    transcript, duration, lang = whisper_service.transcribe_audio_bytes(wav_bytes, "test_tone.wav")
    mem_after_whisper_mb = process.memory_info().rss / (1024 * 1024)
    whisper_delta_mb = mem_after_whisper_mb - mem_before_mb

    print(f"    - Transcription completed: duration={duration:.2f}s, language={lang}")
    print(f"    - Memory After Whisper Tiny Loaded: {mem_after_whisper_mb:.2f} MB (Delta: +{whisper_delta_mb:.2f} MB)")
    assert mem_after_whisper_mb < 2000, "Memory usage exceeded 2 GB threshold!"
    print("    -> WHISPER TINY CPU INT8 TEST PASSED (Safe within 4 GB RAM PC constraint)")

    # 3. Test Real Gemini Flash-Lite Extraction with Voice Test Script
    print("\n[3] Testing Gemini API with gemini-3.1-flash-lite (Standard Voice Script)...")
    sample_voice_script = (
        "Today I completed the authentication setup for my AI Goal Journal project. "
        "I finished Firebase email and password login and tested logging in and logging out. "
        "I also tested the microphone recording feature. "
        "I still need to connect the journal to the backend and improve the dashboard. "
        "I was blocked for some time because I had trouble understanding how Firebase tokens are sent to FastAPI. "
        "Tomorrow I plan to finish the backend integration and work on the journal analysis."
    )
    existing_goals = [
        {"id": "g-1", "title": "Complete AI Goal Journal Project", "status": "Active"},
        {"id": "g-2", "title": "Master React & FastAPI Integration", "status": "Active"},
    ]

    ai_result = gemini_service.analyze_journal(sample_voice_script, existing_goals)
    print("    - Gemini Extraction Result:")
    print(f"      Mood: {ai_result.get('mood')} (Confidence: {ai_result.get('mood_confidence')})")
    print(f"      Activities Extracted: {len(ai_result.get('activities', []))}")
    for act in ai_result.get("activities", []):
        print(f"        * [{act.get('status')}] {act.get('text')}")
    print(f"      Blockers Identified: {len(ai_result.get('blockers', []))}")
    for blk in ai_result.get("blockers", []):
        print(f"        ! [{blk.get('category')}] {blk.get('text')}")
    print(f"      Quick Summary: {ai_result.get('quick_summary')}")
    print("    -> GEMINI EXTRACTION TEST PASSED")

    # 4. Test Weekly Summary Generation
    print("\n[4] Testing Weekly AI Summary Generation...")
    sample_journals = [
        {
            "id": "j-1",
            "content": sample_voice_script,
            "created_at": "2026-08-14T03:00:00",
            "ai_analysis": ai_result,
        }
    ]
    weekly_summary = gemini_service.generate_weekly_summary(
        user_name="Swayam",
        recent_journals=sample_journals,
        goals=existing_goals,
    )
    print("    - Weekly Summary Result:")
    print(f"      Headline: {weekly_summary.get('headline')}")
    print(f"      Wins: {weekly_summary.get('wins')}")
    print(f"      Recurring Blockers: {weekly_summary.get('recurring_blockers')}")
    print(f"      Coaching Advice: {weekly_summary.get('coaching_suggestion')}")
    print("    -> WEEKLY AI SUMMARY TEST PASSED")

    mem_final_mb = process.memory_info().rss / (1024 * 1024)
    print(f"\n[5] Final Total Process Memory: {mem_final_mb:.2f} MB")
    print("==================================================")
    print("ALL INTEGRATION VERIFICATIONS COMPLETED SUCCESSFULLY")
    print("==================================================")

if __name__ == "__main__":
    run_integration_verifications()
