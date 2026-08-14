# Backend DOX Contract — backend/AGENTS.md

> **Subtree Scope**: FastAPI application and Python modules (`backend/`)  
> **Parent Contract**: [`../AGENTS.md`](file:///../AGENTS.md)

---

## 1. Responsibilities

The `backend/` directory houses the complete FastAPI application providing REST endpoints for:
- Firebase token verification and user identification.
- Journal CRUD and voice transcription via local `faster-whisper` Tiny.
- AI semantic extraction and weekly summaries via Google Gemini Flash-Lite.
- Goal management and deterministic progress/activity alignment.
- Thread-safe in-memory persistence.

---

## 2. Invariants & Rules

1. **NO PostgreSQL / NO SQLAlchemy Persistence**:
   - Strictly do not install, configure, or use PostgreSQL, SQLAlchemy, or Alembic in this phase.
   - All persistence must use the in-memory repository layer in `backend/app/repositories/`.
2. **NO Docker / NO Dockerfiles**:
   - Do not create `Dockerfile` or `docker-compose.yml` files.
3. **4 GB RAM PC Constraint**:
   - Use `faster-whisper` **Tiny** on **CPU** with **INT8** compute.
   - Lazy load singleton instance once. Do not load larger models or run simultaneous transcriptions.
4. **Gemini Cost Control**:
   - Use `gemini-3.1-flash-lite` via `google-genai` SDK.
   - Keep `GEMINI_API_KEY` server-side only in root `.env`.
   - Target 1 extraction call per journal; bounded retries.
   - On-demand weekly summaries.
   - Unit tests must NEVER invoke live Gemini APIs.
5. **Security & Authentication**:
   - All protected routes must depend on `get_current_user` in `app/core/auth.py`.
   - Never trust user IDs provided in request bodies; derive identity solely from the verified token.

---

## 3. Subtree Directory Index

- `app/api/` — Route handlers and HTTP endpoint controllers (`/api/v1/*`).
- `app/core/` — App configuration and Firebase Admin auth dependency.
- `app/models/` — Domain entity dataclasses / models.
- `app/repositories/` — Abstract base classes and thread-safe in-memory stores.
- `app/schemas/` — Pydantic request and response schemas.
- `app/services/` — Business logic (Gemini, Whisper, Goals, Journals, Summaries).
- `requirements.txt` — Python dependencies (no SQL/Docker dependencies).
