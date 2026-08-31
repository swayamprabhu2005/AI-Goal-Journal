# AI Goal Journal & Accountability Coach — AGENTS.md

> **Root Agent Contract & DOX Directory**  
> *Methodology*: DOX (Documentation-as-Context) Hierarchy  
> *Target Environment*: Local MVP (React + Vite + Firebase Auth + FastAPI + faster-whisper Tiny + Google Gemini Flash-Lite)

---

## 1. Project Overview & Mission

**AI Goal Journal & Accountability Coach** is an intelligent personal reflection and goal-tracking platform tailored for students, working professionals, freelancers, and entrepreneurs. The application eliminates the friction of manual productivity tracking by using AI to transform conversational text or voice journals into structured activities (completed vs. planned), active blockers, goal progress markers, and weekly accountability coaching insights.

---

## 2. Technology Stack

- **Frontend**: React 18, Vite 5, Tailwind CSS 3 (Custom Calm Moss design system), React Router DOM 6.
- **Backend**: FastAPI, Python 3.10+, Uvicorn.
- **Authentication**: Firebase Authentication (Client-side modular SDK + Backend Firebase Admin token verification).
- **Speech-to-Text**: `faster-whisper` (Model: `tiny`, Device: `cpu`, Compute: `int8`).
- **AI Engine**: Google Gemini API (`gemini-3.1-flash-lite` via `google-genai` SDK).
- **Persistence (Current Phase)**: Thread-safe in-memory repository layer with strict per-user data isolation.
- **Persistence (Future Phase)**: PostgreSQL with SQLAlchemy and Alembic migrations (strictly deferred).

---

## 3. Universal Development Rules for AI Agents

1. **DO NOT Install or Clone DOX**: DOX is a documentation methodology based on `AGENTS.md` files. Do NOT install DOX as an npm package, Python dependency, or Git submodule.
2. **DO NOT Implement PostgreSQL or Docker**: PostgreSQL, SQLAlchemy ORM persistence, database migrations, Dockerfiles, and `docker-compose.yml` are **strictly forbidden** in this phase.
3. **DO NOT Break or Mock Firebase Authentication**: Preserve `src/firebase.js`, `src/services/authService.js`, and `src/context/AuthContext.jsx`. All protected backend endpoints must authenticate requests using verified Firebase ID tokens (`Authorization: Bearer <token>`). Never trust a client-supplied user ID.
4. **4 GB RAM PC Constraint**:
   - Only `faster-whisper` **Tiny** model with **INT8** quantization on **CPU** is permitted.
   - Lazy-load the Whisper model once as a singleton. Never load multiple instances or larger Whisper models (`base`, `small`, `medium`, `large`).
   - No GPU, CUDA, or heavy ML dependencies.
5. **Gemini Cost & Usage Rules**:
   - Use `gemini-3.1-flash-lite` via the `google-genai` Python SDK.
   - Keep `GEMINI_API_KEY` exclusively on the backend in `.env`. Never prefix with `VITE_` or expose to client JavaScript.
   - Target 1 structured extraction call per journal submission. Retries must be explicit and bounded.
   - Weekly AI summaries must be generated on-demand only.
   - Unit tests must NEVER make live Gemini API calls, Firebase network calls, or load the Whisper model.
6. **Preserve User Data on AI Errors**: If Gemini fails to return valid JSON, preserve the raw journal entry in memory and return a clean warning. Never discard user data.
7. **Maintain Calm Moss Aesthetic**: Uphold the tailored Tailwind theme (`paper`, `ink`, `moss`, `ember`, `line`) with `Fraunces` serif headings and `Inter` body text.

---

## 4. Current Implementation Status Matrix

| Component | Status | Details |
| :--- | :--- | :--- |
| **Firebase Auth (Client)** | **Complete** | Registration, Login, Logout, Session persistence, Protected Routes. |
| **Firebase Token Verification (Server)** | **In Progress** | FastAPI dependency `get_current_user` in `backend/app/core/auth.py`. |
| **In-Memory Repositories** | **In Progress** | Thread-safe repositories for Users, Journals, Goals, Summaries. |
| **Speech-to-Text (faster-whisper)** | **In Progress** | Tiny model CPU INT8 lazy singleton; `/voice/transcribe` endpoint. |
| **Gemini AI Extraction** | **In Progress** | `gemini-3.1-flash-lite` structured JSON extraction for journals & summaries. |
| **Goals Management** | **In Progress** | CRUD endpoints and deterministic goal matching. |
| **Weekly AI Coach** | **In Progress** | On-demand structured weekly summaries. |
| **Frontend UI Redesign** | **In Progress** | Connected Dashboard, Journal (Voice + Text), Goals, AI Coach, Profile. |
| **PostgreSQL & SQLAlchemy** | **DEFERRED** | Intentionally omitted for current phase; planned for future phase. |
| **Docker & Docker Compose** | **DEFERRED** | Intentionally omitted for current phase; planned for future phase. |

---

## 5. Security & Environment Rules

- **Zero Secret Commits**: Never commit `.env` or hardcode secrets in source code, documentation, or tests.
- **Frontend vs. Backend Variables**:
  - Frontend: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.
  - Backend: `GEMINI_API_KEY`, `GEMINI_MODEL`, `WHISPER_MODEL`, `WHISPER_DEVICE`, `WHISPER_COMPUTE_TYPE`, `FIREBASE_PROJECT_ID`.
- **Audio Privacy**: Temporary audio uploaded for transcription is written to temporary files and immediately deleted after transcription.

---

## 6. Subtree DOX Directory Index

Before modifying any file in a subtree, agents MUST read the corresponding `AGENTS.md`:

- **Frontend Subtrees**:
  - [`src/AGENTS.md`](file:///src/AGENTS.md) — Frontend overview, styling tokens, React standards.
  - [`src/components/AGENTS.md`](file:///src/components/AGENTS.md) — Reusable UI component contracts and accessibility standards.
  - [`src/context/AGENTS.md`](file:///src/context/AGENTS.md) — Auth state context and session lifecycle rules.
  - [`src/pages/AGENTS.md`](file:///src/pages/AGENTS.md) — Page routing, views, loading/empty states.
  - [`src/services/AGENTS.md`](file:///src/services/AGENTS.md) — Frontend API client and Firebase auth service wrappers.
- **Backend Subtrees**:
  - [`backend/AGENTS.md`](file:///backend/AGENTS.md) — Backend architecture, environment, and error handling.
  - [`backend/app/AGENTS.md`](file:///backend/app/AGENTS.md) — FastAPI application structure, CORS, and middleware.
  - [`backend/app/api/AGENTS.md`](file:///backend/app/api/AGENTS.md) — API v1 route specifications and status code contracts.
  - [`backend/app/core/AGENTS.md`](file:///backend/app/core/AGENTS.md) — Settings and Firebase Admin token verification dependency.
  - [`backend/app/models/AGENTS.md`](file:///backend/app/models/AGENTS.md) — Internal domain entity representations.
  - [`backend/app/repositories/AGENTS.md`](file:///backend/app/repositories/AGENTS.md) — In-memory persistence contracts and migration boundary.
  - [`backend/app/schemas/AGENTS.md`](file:///backend/app/schemas/AGENTS.md) — Pydantic validation schemas.
  - [`backend/app/services/AGENTS.md`](file:///backend/app/services/AGENTS.md) — Business services (Whisper, Gemini, Goals, Journals, Coach).
