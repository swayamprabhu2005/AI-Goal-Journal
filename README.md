# AI Goal Journal & Accountability Coach

An intelligent personal journaling and goal-tracking platform tailored for students, working professionals, freelancers, and entrepreneurs. The application eliminates the manual overhead of traditional productivity tools by using local speech-to-text and AI semantic reasoning to transform daily conversational reflections into structured activities, active blockers, progress indicators, and weekly accountability coaching insights.

---

## 1. Project Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      React SPA (Vite)                       │
│  - Public Landing Page (/) & Smart Auth Routing             │
│  - Modular Firebase Auth (Register, Login, Session Context) │
│  - MediaRecorder Voice Capture with Editable Review Screen  │
│  - Dark Theme Design System (#0A0A1A, #6D28D9, #06B6D4)     │
│  - Reactive Dashboard, Goals Board, AI Coach, Journal Page  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Authorization: Bearer <Firebase ID Token>
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                        │
│  - Firebase ID Token Verification via Google Public Certs   │
│  - REST API Routers: /users, /journals, /goals, /summaries  │
│  - Deterministic Business & Goal-Matching Engine            │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────┐  ┌─────────────────────────────┐
│       faster-whisper        │  │      Google Gemini API      │
│  - Model: tiny (~75 MB)     │  │  - SDK: google-genai        │
│  - Execution: CPU + INT8    │  │  - Model: gemini-3.1-flash-lite
│  - $0.00 Speech-to-Text     │  │  - Structured JSON Output   │
└─────────────────────────────┘  └─────────────────────────────┘
               │                              │
               └──────────────┬───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 In-Memory Repository Layer                  │
│  - User-isolated thread-safe stores (Dictionaries + Locks)  │
│  - Abstract Interfaces (AbstractUserRepository, etc.)       │
│  - Zero PostgreSQL / Zero Docker in this MVP phase          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack & Design System

- **Frontend**: React 18, Vite 5, Tailwind CSS 3, React Router DOM 6.
  - **Design System Tokens**:
    - `Background`: `#0A0A1A`
    - `Foreground`: `#F1F0FF`
    - `Primary`: `#6D28D9` (with Primary Gradient `#6D28D9` $\rightarrow$ `#4C1D95`)
    - `Secondary`: `#1E1B4B` (Secondary Foreground `#C4B5FD`)
    - `Accent`: `#06B6D4` (Cyan accent for voice recording, AI badges, and highlights)
    - `Muted`: `#1A1A35` (Muted Foreground `#8B8AAD`)
  - **Typography**: `Fraunces` serif headings paired with `Inter` body copy.
- **Backend**: FastAPI, Python 3.10+, Uvicorn.
- **Authentication**: Firebase Authentication (Modular client SDK + Backend token verification via Google public X509 certificates).
- **Speech-to-Text**: `faster-whisper` (Model: `tiny`, Device: `cpu`, Compute: `int8`).
- **AI Engine**: Google Gemini API (`gemini-3.1-flash-lite` via `google-genai` Python SDK).
- **Persistence (Current Phase)**: Thread-safe in-memory repository layer with strict per-user data isolation.
- **Persistence (Future Phase)**: PostgreSQL with SQLAlchemy and Alembic migrations (intentionally deferred).

---

## 3. Important Architectural Disclaimers

> [!IMPORTANT]
> **In-Memory Storage**: PostgreSQL persistence is intentionally deferred in the current phase. The current backend uses an in-memory repository and data is lost when the backend server restarts.
>
> **Local Speech-to-Text Model**: Whisper transcription uses a locally hosted `faster-whisper` **Tiny** model running on CPU with INT8 quantization (~75 MB model weights, ~320 MB runtime memory footprint) and does **not** require a Whisper API key.
>
> **4 GB RAM PC Constraint**: The application is strictly optimized for low-resource environments. No CUDA/GPU dependencies are used.

---

## 4. Prerequisites

- **Node.js**: `v18.0.0` or higher
- **Python**: `3.10+`
- **npm**: `v9.0.0` or higher

---

## 5. Setup & Installation Instructions

### Step 1: Clone Repository & Configure Environment

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

Configure your Firebase credentials and Google Gemini API key:

```env
# Frontend Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1

# Backend Configuration
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.1-flash-lite

# Whisper Configuration (Local CPU INT8 for 4 GB RAM PC)
WHISPER_MODEL=tiny
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8
FIREBASE_PROJECT_ID=your_project_id
```

### Step 2: Install Speech-to-Text & Python Dependencies

To install `faster-whisper` (Tiny model engine) along with FastAPI and all backend packages, run:

```bash
python -m pip install -r backend/requirements.txt
```

> **Installed Whisper Model**: `faster-whisper` Tiny (`model="tiny"`, `device="cpu"`, `compute_type="int8"`). Automatically cached to `~/.cache/huggingface/hub/` on first inference.

### Step 3: Install Frontend Dependencies

```bash
npm install
```

---

## 6. Running Locally

### Starting Backend (FastAPI + Uvicorn)

```bash
python -m uvicorn app.main:app --app-dir backend --reload --port 8000
```
- API Docs: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/api/v1/health`

### Starting Frontend (React + Vite)

```bash
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 7. API Reference (`/api/v1/`)

All endpoints (except `/health`) require `Authorization: Bearer <Firebase ID Token>`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service health, model status, and runtime info. |
| `GET` | `/api/v1/users/me` | Fetch authenticated user profile and live metrics. |
| `PUT` | `/api/v1/users/me` | Update user display name and profession. |
| `GET` | `/api/v1/goals` | List goals with optional `?status=` filter (Active, Completed, Stalled). |
| `POST` | `/api/v1/goals` | Create a new goal milestone. |
| `GET` | `/api/v1/goals/{id}` | Retrieve specific goal details. |
| `PUT` | `/api/v1/goals/{id}` | Update goal attributes or status. |
| `DELETE` | `/api/v1/goals/{id}` | Delete goal. |
| `GET` | `/api/v1/journals` | List user journal entries (newest first). |
| `POST` | `/api/v1/journals` | Create journal entry + run Gemini structured analysis. |
| `GET` | `/api/v1/journals/{id}` | Retrieve single journal entry with AI breakdown. |
| `PUT` | `/api/v1/journals/{id}` | Update journal content. |
| `DELETE` | `/api/v1/journals/{id}` | Delete journal entry. |
| `POST` | `/api/v1/journals/voice/transcribe`| Upload audio file $\rightarrow$ local faster-whisper Tiny transcript. |
| `GET` | `/api/v1/summaries/weekly` | Get latest weekly AI coaching summary. |
| `POST` | `/api/v1/summaries/weekly` | Generate fresh weekly AI coaching summary. |

---

## 8. Testing & Verification

### Automated Unit Tests (0 API calls, 0 Whisper loads)

```bash
python -m pytest -v
```

### Integration Verification (Whisper Tiny + Gemini 3.1 Flash-Lite)

```bash
python backend/tests/test_integration.py
```

### Frontend Production Build

```bash
npm run build
```
