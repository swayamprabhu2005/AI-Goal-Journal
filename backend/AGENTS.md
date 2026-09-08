# Backend DOX Contract — backend/AGENTS.md

> **Subtree Scope**: FastAPI application and Python modules (`backend/`)  
> **Parent Contract**: [`../AGENTS.md`](file:///../AGENTS.md)  
> **Target Runtime**: Python 3.10+, FastAPI, Uvicorn, faster-whisper Tiny, Gemini Flash-Lite, AES-256-GCM

---

## 1. Responsibilities

The `backend/` directory houses the complete FastAPI application providing REST endpoints and core business services:
- **Authentication**: Firebase ID token verification via Google public certificates (`app/core/auth.py`).
- **Journal Pipeline**: Conversational text/voice journal ingestion, local `faster-whisper` Tiny transcription, and Gemini Flash-Lite structured JSON extraction.
- **Smart Goals & Velocity**: Goal CRUD, auto-goal creation, deterministic matching, priority calculation (`High Priority`, `Medium Priority`, `Low Priority`), and completion progress auto-sync.
- **Historical Progress & Trends**: Progress checkpoint recording, chronological progress history, step deltas (`change_from_previous`), trend direction (`Improving`, `Stagnant`, `Declining`), and guaranteed 100% completion milestone.
- **Habits Tracker**: In-memory habit CRUD and daily completion tracking via `InMemoryHabitRepository`.
- **Weekly Accountability Coach**: On-demand weekly AI reflection synthesis with habit and blocker analysis.
- **Personal Productivity Score**: Deterministic 0–100 score API evaluating progress, completion, consistency, and blocker penalties.
- **Enterprise-Grade Cryptography**: Centralized AES-256-GCM encryption (`app/core/crypto.py`), plaintext backward-compatibility, and zero-downtime key rotation (`app/core/key_rotation.py`).
- **Persistence**: Thread-safe in-memory repository layer with strict per-user isolation.

---

## 2. Invariants & Rules

1. **NO Docker / NO Live PostgreSQL Required**:
   - Docker and Docker Desktop are **strictly NOT required** to run this backend.
   - The application runs directly using local Python (`python -m uvicorn app.main:app --app-dir backend --port 8000`).
   - Default runtime persistence uses thread-safe in-memory repositories (`app/repositories/in_memory.py`). Live PostgreSQL servers are NOT required for the local MVP.
   - **In-Memory Lifecycle**: During local MVP operation, all state (journals, goals, habits, progress) lives in Python process memory (RAM). When the server process restarts (such as when uvicorn reloads after code edits or when closing the terminal), the in-memory store reinitializes. Durable disk persistence via PostgreSQL/SQLAlchemy is deferred to the cloud phase.
2. **4 GB RAM PC Constraint**:
   - Only `faster-whisper` **Tiny** model with **INT8** quantization on **CPU** is permitted.
   - Lazy-load the Whisper model once as a singleton in `app/services/whisper_service.py`. Never load multiple instances or larger models.
   - Audio files must be deleted immediately after transcription.
3. **Gemini Cost Control & Safety**:
   - Model: `gemini-3.1-flash-lite` via `google-genai` Python SDK.
   - Target 1 structured extraction call per journal submission.
   - Summaries generated on-demand only.
   - Unit tests must NEVER invoke live Gemini APIs, Firebase network endpoints, or Whisper models.
4. **Field Encryption & Decryption**:
   - Encrypted fields use the `enc:v1:<base64(12-byte-nonce + ciphertext + tag)>` format.
   - Any record lacking the `enc:v1:` prefix is legacy plaintext and must be returned unchanged.
   - Gemini AI service must always receive decrypted plaintext.
5. **Security & User Ownership**:
   - All protected endpoints must depend on `get_current_user` in `app/core/auth.py`.
   - Never trust client-supplied user IDs; all repository operations must use `current_user.uid`.

---

## 3. Subtree Directory Index

- `app/api/v1/` — REST API route controllers:
  - `users.py` — User profile endpoints
  - `journals.py` — Journal CRUD & AI extraction
  - `goals.py` — Goal CRUD, prioritization, velocity
  - `progress.py` — Progress recording, history, and trend API (`/goal/{goal_id}/trend`)
  - `habits.py` — Habit tracking and daily check-offs
  - `summaries.py` — Weekly AI accountability summaries
  - `productivity.py` — Productivity score (0–100) endpoint
- `app/core/` — Infrastructure and security utilities:
  - `config.py` — Environment configuration (`Settings`)
  - `auth.py` — Firebase ID token verification dependency
  - `crypto.py` — AES-256-GCM field encryption service
  - `key_rotation.py` — Key rotation management utility
- `app/models/` — Domain dataclasses (`domain.py`)
- `app/repositories/` — Repository pattern (`in_memory.py` default; `postgres.py` prepared for future cloud)
- `app/schemas/` — Pydantic request/response validation schemas
- `app/services/` — Core business logic services (Whisper, Gemini, Goals, Journals, Progress, Productivity, Coach, Migration)
- `scripts/` — Database administration and maintenance scripts:
  - `migrate_existing_data.py` — Safe batch migration CLI tool converting legacy plaintext to AES-256-GCM ciphertext
- `tests/` — Automated pytest unit, security, and migration tests (`test_encryption.py`, `test_progress_trends.py`, `test_auto_goals.py`, `test_migration.py`, `test_slash_routes.py`, `test_unit.py`)
- `requirements.txt` — Python dependencies
