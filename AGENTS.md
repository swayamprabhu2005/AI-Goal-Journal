# AI Goal Journal & Accountability Coach — AGENTS.md

> **Root Agent Contract & DOX Directory**  
> *Methodology*: DOX (Documentation-as-Context) Hierarchy  
> *Target Environment*: Local MVP (React + Vite + Firebase Auth + FastAPI + faster-whisper Tiny + Google Gemini Flash-Lite + In-Memory Persistence + AES-256-GCM Encryption)

---

## 1. Project Overview & Mission

**AI Goal Journal & Accountability Coach** is an intelligent personal reflection, habit consistency, and goal-tracking platform tailored for students, working professionals, freelancers, and entrepreneurs. The application eliminates the friction of manual productivity tracking by using AI to transform conversational text or voice journals into structured activities (completed vs. planned), active blockers, goal progress markers, smart goal prioritization, and weekly accountability coaching insights.

---

## 2. Technology Stack

- **Frontend**: React 18, Vite 5, Tailwind CSS 3 (Custom Calm Moss design system), React Router DOM 6, Anime.js, Canvas Confetti.
- **Backend**: FastAPI, Python 3.10+, Uvicorn, Pydantic v2.
- **Authentication**: Firebase Authentication (Client-side modular SDK + Backend Firebase Admin / Google public cert token verification).
- **Speech-to-Text**: `faster-whisper` (Model: `tiny`, Device: `cpu`, Compute: `int8`, lazy singleton).
- **AI Engine**: Google Gemini API (`gemini-3.1-flash-lite` via `google-genai` SDK).
- **Security & Cryptography**: AES-256-GCM field encryption (`cryptography`), plaintext backward compatibility, zero-downtime key rotation.
- **Persistence (Current Phase)**: Thread-safe in-memory repository layer with strict per-user data isolation.
- **Persistence (Future Cloud Phase)**: PostgreSQL with SQLAlchemy and Alembic migrations (strictly deferred; not required for running the app).

---

## 3. Universal Development Rules for AI Agents

1. **DO NOT Install or Clone DOX**: DOX is a documentation methodology based on `AGENTS.md` files. Do NOT install DOX as an npm package, Python dependency, or Git submodule.
2. **NO Docker / NO Running PostgreSQL Required**:
   - Docker, Docker Desktop, Dockerfiles, and `docker-compose.yml` are **strictly NOT needed** to run this website.
   - The application runs directly in local Python (`3.10+`) and Node.js (`18+`) environments.
   - The runtime default persistence is the thread-safe **in-memory repository layer** (`backend/app/repositories/in_memory.py`). Live PostgreSQL servers are NOT required.
   - **In-Memory Lifecycle**: During local MVP operation, all state (journals, goals, habits, progress) lives in Python process memory (RAM). When the server process restarts (such as when uvicorn reloads after code edits or when closing the terminal), the in-memory store reinitializes. Durable disk persistence via PostgreSQL/SQLAlchemy is deferred to the cloud phase.
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
6. **Field-Level Encryption & Backward Compatibility**:
   - Sensitive user journal entries and coaching summaries are encrypted using AES-256-GCM with the `enc:v1:` prefix.
   - Plaintext records created prior to encryption must be decrypted transparently without errors.
   - Gemini AI service must always receive decrypted plaintext.
7. **Preserve User Data on AI Errors**: If Gemini fails to return valid JSON, preserve the raw journal entry in memory and return a clean warning. Never discard user data.
8. **Maintain Calm Moss Aesthetic**: Uphold the tailored Tailwind theme (`paper`, `ink`, `moss`, `ember`, `line`) with `Fraunces` serif headings and `Inter` body text.

---

## 4. Current Implementation Status Matrix

| Component | Status | Details |
| :--- | :--- | :--- |
| **Firebase Auth (Client)** | **Complete** | Registration, Login, Logout, Session persistence, Protected Routes. |
| **Firebase Token Verification (Server)** | **Complete** | FastAPI dependency `get_current_user` in `backend/app/core/auth.py`. |
| **In-Memory Repositories** | **Complete** | Thread-safe in-memory stores for Users, Journals, Goals, Habits, Progress, Summaries. |
| **Speech-to-Text (faster-whisper)** | **Complete** | Tiny model CPU INT8 lazy singleton; ephemeral audio cleanup; `/voice/transcribe`. |
| **AI Journal & In-Place Analysis** | **Complete** | `gemini-3.1-flash-lite` structured extraction; in-place result transition + auto-scroll; renamed to AI Journal. |
| **Goals Management & Prioritization** | **Complete** | CRUD endpoints, deterministic goal matching, smart priority, auto-sync 100% progress on completion. |
| **Historical Progress & Trend API** | **Complete** | Chronological ordering, deltas (`change_from_previous`), trend direction (`improving`), completed badges. |
| **Habits Tracker & Streaks** | **Complete** | In-memory persistence, Monday–Sunday sequence, ordinal dates (`21st`), week navigation (`<`, `>`), optimistic check-offs. |
| **Field Encryption & Key Rotation** | **Complete** | AES-256-GCM envelope encryption, backward compatibility, `KeyRotationManager`. |
| **Productivity Score API (0–100)** | **Complete** | Multi-factor deterministic formula mounted at `/api/v1/productivity-score`. |
| **Brand Identity & Navigation** | **Complete** | Custom quill & AI chip logo (`public/logo.png`), responsive sidebar spacing, calendar padding. |
| **PostgreSQL & Docker** | **DEFERRED** | ORM models prepared for future cloud phase; zero runtime requirement for local MVP. |

---

## 5. Security & Environment Rules

- **Zero Secret Commits**: Never commit `.env` or hardcode secrets in source code, documentation, or tests.
- **Frontend vs. Backend Variables**:
  - Frontend: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.
  - Backend: `GEMINI_API_KEY`, `GEMINI_MODEL`, `WHISPER_MODEL`, `WHISPER_DEVICE`, `WHISPER_COMPUTE_TYPE`, `FIREBASE_PROJECT_ID`, `ENCRYPTION_KEY`, `ENCRYPTION_OLD_KEYS`.
- **Audio Privacy**: Temporary audio uploaded for transcription is written to temporary files and immediately deleted after transcription.

---

## 6. Subtree DOX Directory Index

Before modifying any file in a subtree, agents MUST read the corresponding `AGENTS.md`:

- **Frontend Subtrees**:
  - [`src/AGENTS.md`](file:///src/AGENTS.md) — Frontend overview, styling tokens, React standards, pages, and components.
  - [`src/components/AGENTS.md`](file:///src/components/AGENTS.md) — Reusable UI component contracts and accessibility standards.
  - [`src/context/AGENTS.md`](file:///src/context/AGENTS.md) — Auth state context, DataContext, ModalContext.
  - [`src/pages/AGENTS.md`](file:///src/pages/AGENTS.md) — Page routing, views, loading/empty states.
  - [`src/services/AGENTS.md`](file:///src/services/AGENTS.md) — Frontend API client and Firebase auth service wrappers.
- **Backend Subtrees**:
  - [`backend/AGENTS.md`](file:///backend/AGENTS.md) — Backend architecture, environment, and error handling.
  - [`backend/app/AGENTS.md`](file:///backend/app/AGENTS.md) — FastAPI application structure, CORS, and middleware.
  - [`backend/app/api/AGENTS.md`](file:///backend/app/api/AGENTS.md) — API v1 route specifications and status code contracts.
  - [`backend/app/core/AGENTS.md`](file:///backend/app/core/AGENTS.md) — Settings, Auth, AES-256-GCM crypto, Key Rotation.
  - [`backend/app/models/AGENTS.md`](file:///backend/app/models/AGENTS.md) — Internal domain entity representations.
  - [`backend/app/repositories/AGENTS.md`](file:///backend/app/repositories/AGENTS.md) — In-memory persistence contracts and migration boundary.
  - [`backend/app/schemas/AGENTS.md`](file:///backend/app/schemas/AGENTS.md) — Pydantic validation schemas.
  - [`backend/app/services/AGENTS.md`](file:///backend/app/services/AGENTS.md) — Business services (Whisper, Gemini, Goals, Journals, Progress, Productivity, Coach).
