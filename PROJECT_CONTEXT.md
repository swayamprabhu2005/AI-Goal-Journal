# Project Context & Architecture — AI Goal Journal & Accountability Coach

> **Platform Mission**: Transform unstructured daily reflections into actionable momentum, structured tasks, obstacle awareness, and weekly AI coaching.  
> **Development Phase**: Local MVP (React + Vite + Firebase Auth + FastAPI + faster-whisper Tiny + Gemini Flash-Lite + In-Memory Persistence).

---

## 1. Core Mission & User Personas

Traditional productivity tools place a heavy manual burden on users: checkboxes must be checked, tags must be categorized, and progress must be typed into rigid tables. 

**AI Goal Journal & Accountability Coach** flips this model:
- **Users**: Students, Working Professionals, Freelancers, Entrepreneurs.
- **Workflow**: The user writes or speaks conversationally about what happened during their day.
- **AI Synthesis**: Local speech recognition (`faster-whisper` Tiny) transcribes voice notes on the CPU at zero external API cost. Google Gemini Flash-Lite (`gemini-3.1-flash-lite`) extracts completed activities, ongoing tasks, future plans, active blockers, and sentiment.
- **Deterministic Progress**: Activities are intelligently matched to active goals.
- **Weekly Accountability**: On-demand weekly coaching reports synthesize momentum and highlight recurring blocker hazards.

---

## 2. System Architecture & Routing Flow

```
[Public Visitor] ────► / (Landing Page)
                            ├──► Start Journaling Free ──► /register ──► Firebase Auth ──► /dashboard
                            └──► Sign In ──────────────► /login ───► Firebase Auth ──► /dashboard

[Authenticated User] ──► / ──► Auto-Redirect to /dashboard
                            ├──► /journal (Dual Text & Voice Reflection with Whisper Tiny)
                            ├──► /goals (CRUD Goals, Status Filters: Active/Completed/Stalled)
                            ├──► /coach (Weekly AI Accountability Coach Summary)
                            └──► /profile (Identity, Profession, Live Activity Metrics)
```

---

## 3. Technology Stack & Operational Limits

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite 5, Tailwind CSS 3 | Calm Moss & Sage design system (`Fraunces` headings, `Inter` body). |
| **Authentication** | Firebase Authentication | Modular client SDK + Backend Firebase Admin / Google Cert token validation. |
| **Backend API** | FastAPI, Python 3.10+, Uvicorn | REST API v1 (`/users`, `/journals`, `/goals`, `/summaries`). |
| **Speech-to-Text** | `faster-whisper` (Tiny, CPU, INT8) | Local inference singleton. Measured RAM: ~335 MB. Zero remote API cost. |
| **AI Reasoning** | Google Gemini (`gemini-3.1-flash-lite`) | Structured JSON extraction (Activities, Blockers, Mood, Weekly Synthesis). |
| **Persistence (Current)**| In-Memory Repository Layer | Thread-safe, user-isolated memory stores (`threading.Lock`). |
| **Persistence (Future)** | PostgreSQL + SQLAlchemy + Alembic | Strictly deferred to future cloud phase. |
| **Containerization** | Docker & Docker Compose | Strictly deferred to future cloud phase. |

---

## 4. Implementation Status Matrix

| Component | Status | Verification Detail |
| :--- | :--- | :--- |
| **Public Landing Page** | **COMPLETE** | Hero, interactive preview, 4 feature pillars, workflow guide, responsive footer. |
| **Public vs Auth Routing** | **COMPLETE** | `/` renders landing page for guests, `/dashboard` for authenticated users. |
| **Firebase Auth (Client)** | **COMPLETE** | Registration, Login, Logout, Session persistence, Protected routes. |
| **Firebase Token (Backend)** | **COMPLETE** | Verified via Google public certificates; extracts authentic user claims. |
| **In-Memory Persistence** | **COMPLETE** | Thread-safe per-user isolation for Users, Goals, Journals, Summaries. |
| **faster-whisper Tiny** | **COMPLETE** | CPU INT8 inference with temporary file deletion. Measured RAM: ~335 MB. |
| **Gemini AI Structuring** | **COMPLETE** | Structured JSON with completed vs planned differentiation & blocker categorization. |
| **Goals Management** | **COMPLETE** | Full CRUD, status filtering (`Active`, `Completed`, `Stalled`), and deterministic matching. |
| **Weekly AI Coach** | **COMPLETE** | On-demand weekly summary generation with wins, recurring blockers, and recommendations. |
| **UI/UX Design System** | **COMPLETE** | Calm Moss palette, custom gradients (`primary-moss`, `coach-grad`, `voice-grad`). |
| **PostgreSQL & Docker** | **DEFERRED** | Documented boundary for subsequent cloud phase. |

---

## 5. Security & Privacy Decisions

1. **Zero Secret Leakage**: `GEMINI_API_KEY` is strictly backend-only. Never prefixed with `VITE_` or exposed in client bundles.
2. **Authoritative Identity**: The backend derives the user ID strictly from the verified Firebase ID Token (`get_current_user` dependency) and never trusts client-supplied user IDs.
3. **Audio Lifecycle**: Uploaded audio is written to temporary files, transcribed, and deleted in a `finally` block.
