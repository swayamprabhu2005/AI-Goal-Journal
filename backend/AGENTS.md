# Backend DOX Contract — backend/AGENTS.md

> **Subtree Scope**: FastAPI application and Python modules (`backend/`)  
> **Parent Contract**: [`../AGENTS.md`](file:///../AGENTS.md)  
> **Target Runtime**: Python 3.10+, FastAPI, Uvicorn, faster-whisper Tiny, PyTorch CPU, Groq Cloud API, Gemini Flash-Lite, AES-256-GCM

---

## 1. Responsibilities

The `backend/` directory houses the complete FastAPI application providing REST endpoints and core business services:
- **Authentication**: Firebase ID token verification via Google public certificates (`app/core/auth.py`).
- **Journal Pipeline**: Conversational text/voice journal ingestion, local `faster-whisper` Tiny transcription, Gemini Flash-Lite structured JSON extraction, and PyTorch 10-Class Mood Analysis.
- **Custom Emotion AI**: PyTorch 4-Head Attention BiLSTM model (`app/services/mood_service.py`) detecting emotional states (`accomplishment`, `motivation`, `focus`, `gratitude`, `breakthrough`, `burnout`, `overwhelmed`, `frustration`, `guilt`, `neutral`) with confidence and keyword extraction in ~3–5 ms on CPU.
- **Conversational AI Coach**: Interactive two-way coaching via Groq Cloud API (`app/services/groq_service.py`, `app/api/v1/coach.py`) using `openai/gpt-oss-120b`, grounded with user goals, habit streaks, recent journals, and emotional pulse.
- **Smart Goals & Velocity**: Goal CRUD, auto-goal creation, deterministic matching, priority calculation (`High Priority`, `Medium Priority`, `Low Priority`), and completion progress auto-sync.
- **Historical Progress & Trends**: Progress checkpoint recording, chronological progress history, step deltas (`change_from_previous`), trend direction (`Improving`, `Stagnant`, `Declining`), and guaranteed 100% completion milestone.
- **Enriched Habits Tracker**: Single-query habit performance endpoint calculating `completed_today`, `current_streak`, and `recent_logs` in one database pass to eliminate $N+1$ latency.
- **Weekly Accountability Coach**: On-demand weekly AI reflection synthesis with habit and blocker analysis.
- **Personal Productivity Score**: Deterministic 0–100 score API evaluating progress, completion, consistency, and blocker penalties.
- **Enterprise-Grade Cryptography**: Centralized AES-256-GCM encryption (`app/core/crypto.py`), plaintext backward-compatibility, and zero-downtime key rotation (`app/core/key_rotation.py`).
- **Persistence (Dual)**: Dedicated PostgreSQL container on port 5433 with transparent, automatic fallback to local SQLite (`sqlite:///./app.db`).

---

## 2. Invariants & Rules

1. **Dual Persistence (PostgreSQL Primary + SQLite Fallback)**:
   - The primary database is PostgreSQL running in a dedicated Docker container (`ai_goal_journal_db` mapped to host port `5433:5432` to avoid collisions with other system databases).
   - If Docker or PostgreSQL is not available, the backend automatically and seamlessly falls back to local SQLite (`sqlite:///./app.db`) via `app/database/connection.py`.
   - All models and repository implementations support both PostgreSQL and SQLite identically.
2. **4 GB RAM PC Constraint**:
   - Only `faster-whisper` **Tiny** model with **INT8** quantization on **CPU** is permitted.
   - The PyTorch Mood Analyzer runs exclusively on **CPU** using lightweight embeddings (~30 MB RAM footprint).
   - All complex language reasoning (Gemini Flash-Lite, Groq Conversational Coach) executes **100% in the cloud** via remote APIs, preventing local RAM exhaustion.
   - Audio files must be deleted immediately after transcription.
3. **AI Cost Control & Safety**:
   - Extraction model: `gemini-3.1-flash-lite` via `google-genai` Python SDK.
   - Conversational Coach: Groq Cloud API with multi-model fallback (`openai/gpt-oss-120b`, `qwen/qwen3.8-27b`, `openai/gpt-oss-20b`).
   - Target 1 structured extraction call per journal submission.
   - Summaries generated on-demand only.
   - Unit tests must NEVER invoke live Gemini APIs, Groq APIs, Firebase network endpoints, or Whisper models.
4. **Field Encryption & Decryption**:
   - Encrypted fields use the `enc:v1:<base64(12-byte-nonce + ciphertext + tag)>` format.
   - Any record lacking the `enc:v1:` prefix is legacy plaintext and must be returned unchanged.
   - Gemini and Groq AI services must always receive decrypted plaintext.
5. **Security & User Ownership**:
   - All protected endpoints must depend on `get_current_user` in `app/core/auth.py`.
   - Never trust client-supplied user IDs; all repository operations must use `current_user.uid`.

---

## 3. Subtree Directory Index

- `app/api/v1/` — REST API route controllers:
  - `users.py` — User profile endpoints
  - `journals.py` — Journal CRUD, voice transcription, and mood metadata
  - `coach.py` — Two-way conversational AI coach endpoint (`POST /api/v1/coach/chat`)
  - `goals.py` — Goal CRUD, prioritization, velocity
  - `progress.py` — Progress recording, history, and trend API (`/goal/{goal_id}/trend`)
  - `habits.py` — Single-request enriched habit tracking and daily check-offs
  - `summaries.py` — Weekly AI accountability summaries
  - `productivity.py` — Productivity score (0–100) endpoint
  - `roadmap.py` — AI-powered Goal Roadmap generation, milestone tracking, and step completion
- `app/core/` — Infrastructure and security utilities:
  - `config.py` — Environment configuration (`Settings`) including `GROQ_API_KEY` and `GROQ_MODEL`
  - `auth.py` — Firebase ID token verification dependency
  - `crypto.py` — AES-256-GCM field encryption service
  - `key_rotation.py` — Key rotation management utility
- `app/database/` — Database connection probing, session creation, engine setup, and auto-migrations (`connection.py`, `init_db.py`, `orm_models.py`)
- `app/models/` — Domain dataclasses (`domain.py`)
- `app/repositories/` — Repository pattern (`in_memory.py` for testing/RAM fallback, `postgres.py` for dual PostgreSQL/SQLite persistence)
- `app/schemas/` — Pydantic validation schemas (`journal.py`, `coach.py`, `habit.py`, `goal.py`, `roadmap.py`, `user.py`, `summary.py`)
- `app/services/` — Core business logic services:
  - `mood_service.py` — PyTorch 10-Class Attention BiLSTM inference engine
  - `groq_service.py` — Groq Cloud conversational coach with context grounding
  - `gemini_service.py` — Google Gemini structured extraction and roadmap generator
  - `whisper_service.py` — faster-whisper on-device speech transcription
  - `journal_service.py`, `goal_service.py`, `habit_service.py`, `progress_service.py`, `productivity_service.py`, `migration_service.py`
- `scripts/` — Database administration and maintenance scripts:
  - `migrate_existing_data.py` — Safe batch migration CLI tool converting legacy plaintext to AES-256-GCM ciphertext
- `tests/` — Automated pytest test suite:
  - `test_mood_and_coach.py` — PyTorch mood inference and Groq coach tests
  - `test_roadmap_api.py` — Roadmap endpoints & milestone completion
  - `test_progress_trends.py` — Period metrics & delta analytics
  - `test_migration.py` — Encryption migration idempotency
  - `test_slash_routes.py` — URL routing integrity
  - `test_unit.py` — Core unit and isolation tests
- `requirements.txt` — Python dependencies
