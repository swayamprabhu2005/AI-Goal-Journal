# AI Goal Journal & Accountability Coach

> **An intelligent personal reflection, habit tracking, and goal-momentum platform.**  
> Powered by local speech-to-text, Google Gemini Flash-Lite reasoning, and client-side encryption.

---

## 📌 Frequently Asked Questions (Docker, Database & Persistence)

### ❓ Do I need Docker or Docker Desktop running?
**NO, absolutely not.**  
Docker is **NOT required** to run this project. The application is specifically designed to run as a lightweight local development MVP directly using your local Python (`3.10+`) and Node.js (`18+`) environments.

### ❓ Do I need PostgreSQL installed and running?
**NO.**  
By default, the backend uses a thread-safe **in-memory repository layer** (`backend/app/repositories/in_memory.py`) with strict per-user data isolation. You do not need to install, configure, or run a PostgreSQL database server. PostgreSQL schemas, Alembic migrations, and Docker containerization are deferred to future production deployment phases.

### ❓ Why did my created items disappear when the page was refreshed?
During the current **Local MVP** stage, the application operates on an **in-memory repository layer** (RAM) to remain 100% dependency-free with zero Docker/PostgreSQL overhead.  
- **While the backend is running continuously**: All journals, goals, habits, and progress records persist across page navigations, browser refreshes, and tabs.
- **When the backend process restarts**: Because Uvicorn runs in live development mode (`--reload`), any backend Python code modifications automatically restart the Python process, which clears the volatile in-memory RAM store.
- **Future Production Phase**: PostgreSQL with SQLAlchemy ORM models is fully prepared and will provide durable, permanent disk storage across server restarts.

---

## 1. System Overview & Mission

Traditional productivity applications demand tedious administrative work: checking checkboxes, entering numeric spreadsheets, and organizing manual tags.

**AI Goal Journal & Accountability Coach** removes all tracking friction:
- **Speak or Type Conversationally**: Express your day, achievements, blockers, and plans naturally via text or voice.
- **Local Speech Recognition**: Zero-cost, privacy-preserving speech-to-text using `faster-whisper` (Tiny model, INT8 quantized on CPU).
- **AI Semantic Reasoning**: Google Gemini (`gemini-3.1-flash-lite`) extracts completed activities, planned tasks, active blockers, sentiment, and goal progress.
- **In-Place Reflection Flow**: Instant in-place transition from entry draft to structured AI results with smooth auto-scroll.
- **Deterministic Alignment**: Activities and progress increments are automatically matched against your active goals.
- **Smart Goal Prioritization**: Automated priority calculation (`High Priority`, `Medium Priority`, `Low Priority`) factoring in deadlines, progress velocity, stalled states, and completion.
- **Goal Completion Synchronization**: Marking a goal as completed automatically logs a 100% milestone record and displays celebration banners and badges in Progress History & Trend.
- **Habit Consistency & Week Navigation**: Habit tracker with strict Monday–Sunday weekly layouts, ordinal date numbers (`21st`), week navigation (`<`, `>`), and streak tracking.
- **Historical Progress & Trend Analytics**: Complete progress history with step-by-step delta calculations and trend direction (`Improving`, `Stagnant`, `Declining`).
- **Enterprise-Grade Field Privacy**: Transparent field-level AES-256-GCM envelope encryption protecting sensitive reflections with zero-downtime key rotation support.

---

## 2. Technology Stack

| Layer | Technologies | Details |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite 5, Tailwind CSS 3, React Router DOM 6 | Custom Calm Moss design system, SVG trend charts, Anime.js micro-interactions. |
| **Authentication** | Firebase Authentication | Modular Web SDK v10 (client) + Firebase Admin / Google public cert verification (server). |
| **Backend API** | FastAPI, Python 3.10+, Uvicorn, Pydantic v2 | High-performance asynchronous REST API with strictly typed schemas. |
| **Speech-to-Text** | `faster-whisper` (`tiny`, CPU, `int8`) | Lazy singleton in-memory speech engine. RAM: ~330 MB. Immediate ephemeral audio cleanup. |
| **AI Extraction** | Google Gemini (`gemini-3.1-flash-lite`) | Structured JSON extraction via `google-genai` Python SDK. |
| **Encryption** | AES-256-GCM (`cryptography`) | Envelope format `enc:v1:...` with transparent backward-compatibility for existing plaintext. |
| **Persistence (Current)**| In-Memory Repository Layer | Thread-safe, per-user memory stores with zero external database dependencies. |
| **Persistence (Future)** | PostgreSQL + SQLAlchemy + Alembic | ORM models prepared for future multi-tenant cloud deployment. |

---

## 3. Directory Structure

```text
AI-GOAL-JOURNAL/
├── public/                       # Static public assets (logo.png)
├── src/                          # React Single Page Application (SPA)
│   ├── animations/               # Anime.js motion helpers (motion.js)
│   ├── assets/                   # Bundled brand assets (logo.png)
│   ├── components/               # Reusable UI components (Sidebar, Calendar, Celebration, Skeletons)
│   ├── context/                  # React Contexts (AuthContext, DataContext, ModalContext)
│   ├── pages/                    # Application Views:
│   │   ├── Dashboard.jsx         # Momentum overview, active goals, Productivity Score
│   │   ├── Journal.jsx           # AI Journal dual voice/text journaling & in-place extraction
│   │   ├── Goals.jsx             # Smart goal management, priority filters & confetti celebration
│   │   ├── Calendar.jsx          # Interactive monthly calendar with deadline inspector & padding
│   │   ├── Habits.jsx            # Habit tracker with Monday-Sunday grid, ordinal dates, week nav
│   │   ├── progress.jsx          # SVG progress trend chart, completed goal sync, history timeline
│   │   ├── AiCoach.jsx           # On-demand weekly AI accountability synthesis
│   │   ├── Profile.jsx           # User identity, professional background, live stats
│   │   ├── Login.jsx             # Firebase authentication login
│   │   ├── Register.jsx          # Firebase registration
│   │   └── LandingPage.jsx       # Public landing page for guests
│   ├── services/                 # Frontend API client (api.js) & auth wrappers
│   ├── utils/                    # Utility storage and helpers (habitStorage.js)
│   ├── App.jsx                   # React Router DOM 6 route definitions
│   └── index.css                 # Calm Moss design system tokens & base styles
├── backend/                      # FastAPI Python Application
│   ├── app/
│   │   ├── api/v1/               # REST API Routers:
│   │   │   ├── users.py          # User profile endpoints
│   │   │   ├── journals.py       # Journal CRUD & AI extraction pipeline
│   │   │   ├── goals.py          # Goal CRUD & deterministic matching
│   │   │   ├── progress.py       # Progress recording, history & trend API
│   │   │   ├── habits.py         # Habit management & daily completion
│   │   │   ├── summaries.py      # Weekly AI accountability coach synthesis
│   │   │   └── productivity.py   # Personal Productivity Score (0-100) API
│   │   ├── core/                 # App configuration, auth verification, AES-256 crypto, key rotation
│   │   │   ├── config.py         # Pydantic BaseSettings (.env loading)
│   │   │   ├── auth.py           # Firebase ID token verification dependency
│   │   │   ├── crypto.py         # AES-256-GCM encryption service
│   │   │   └── key_rotation.py   # Key rotation management utility
│   │   ├── models/               # Domain dataclasses (Goal, Journal, Progress, Habit, Summary)
│   │   ├── repositories/         # Thread-safe in-memory stores & future PostgreSQL repo definitions
│   │   ├── schemas/              # Pydantic v2 validation models
│   │   ├── services/             # Core business logic:
│   │   │   ├── goal_service.py   # Prioritization, velocity, and matching
│   │   │   ├── journal_service.py# AI extraction, encrypted storage, status transitions
│   │   │   ├── progress_service.py # Historical trends, deltas, and progress recording
│   │   │   ├── productivity_service.py # 0-100 productivity score formula
│   │   │   ├── summary_service.py# On-demand weekly coach synthesis
│   │   │   ├── whisper_service.py# Local faster-whisper Tiny STT
│   │   │   └── gemini_service.py # Google Gemini API structured caller
│   │   └── main.py               # FastAPI entry point, CORS middleware, route mounting
│   ├── tests/                    # 22 Comprehensive automated pytest tests:
│   │   ├── test_encryption.py    # AES-256-GCM confidentiality, tampering, rotation tests
│   │   ├── test_progress_trends.py# Chronological progress, delta calculation, priority tests
│   │   ├── test_auto_goals.py    # Goal deduplication and auto-creation tests
│   │   ├── test_slash_routes.py  # Route structure & non-redirect tests
│   │   └── test_unit.py          # CRUD, auth verification, and service isolation tests
│   └── requirements.txt          # Python dependencies
├── docs/                         # Architecture documentation, compliance, and specifications
│   └── Progress_Value_Calculation_and_HIPAA_Compliance_Report.docx
├── AGENTS.md                     # Root DOX contract & agent guidelines
├── README.md                     # Complete project documentation & quick start guide
└── package.json                  # Frontend dependencies and scripts
```

---

## 4. Key Platform Features

### 1. Conversational Voice & Text Journaling
- Record thoughts using the built-in browser audio recorder. Local `faster-whisper` Tiny transcribes the audio on your CPU in seconds with **zero API cost**.
- Uploaded audio chunks are transcribed into memory and immediately deleted for maximum privacy.
- Google Gemini Flash-Lite analyzes the text to extract completed activities, future tasks, active blockers, and sentiment.

### 2. Smart Goal Prioritization & Velocity Calculation
- Automated classification into **`High Priority`**, **`Medium Priority`**, or **`Low Priority`**:
  - Overdue incomplete goals → `High Priority`
  - Deadlines within 7 days with progress < 50% → `High Priority`
  - Goals flagged as `Stalled` by blockers → `High Priority`
  - Approaching deadlines (≤ 30 days) with moderate progress → `Medium Priority`
  - Distant deadlines (> 30 days) or completed goals → `Low Priority`
- Calculates estimated completion days (`~X days left`) based on daily completion velocity.

### 3. Historical Progress & Trend Analytics
- Dedicated endpoint `GET /api/v1/progress/goal/{goal_id}/trend` provides chronological progress updates.
- Calculates step-by-step progress change (`change_from_previous`), `net_change`, and overall trajectory (`Improving`, `Stagnant`, `Declining`).
- Rendered via a responsive, lightweight pure-SVG trend chart with milestone tooltips.

### 4. Daily Habit Tracker & Streaks
- Create recurring daily habits with categories and target frequencies.
- One-click daily check-off with streak tracking and animated feedback.

### 5. Goal Completion Celebration
- Interactive celebration overlay powered by Canvas Confetti appears the moment a goal transitions to `Completed`.

### 6. Field-Level AES-256-GCM Encryption
- User journal entries and weekly summaries are encrypted before persistence using `enc:v1:<base64(12-byte-nonce + ciphertext + tag)>`.
- **Plaintext Backward-Compatibility**: Existing plaintext records decrypt safely without errors.
- **Privacy for AI Pipeline**: Gemini AI always receives plaintext for accurate analysis.
- **Key Rotation**: Dedicated `KeyRotationManager` enables zero-downtime key rotation.

### 7. Personal Productivity Score (0–100)
- Auditable, deterministic score calculated from:
  - Active Goal Progress ($30\%$)
  - Goal Completion Ratio ($20\%$)
  - Completed Activities in the last 7 days ($20\%$)
  - Journaling Consistency / Active Days ($20\%$)
  - Active Blocker Penalties (up to $-15\%$)

---

## 5. Quick Start Guide

### Prerequisites
- **Node.js**: `v18.0.0` or higher (with `npm`)
- **Python**: `3.10` or higher

---

### Step 1: Clone and Configure Environment

Ensure your `.env` file exists in the root directory:
```env
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.1-flash-lite

# Whisper Speech-to-Text
WHISPER_MODEL=tiny
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8

# Encryption Key (Optional - will use secure default if omitted)
ENCRYPTION_KEY=your-32-byte-hex-or-passphrase-here

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-firebase-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-firebase-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

### Step 2: Run the Backend API

1. Open a terminal in the project root:
   ```bash
   python -m pip install -r backend/requirements.txt
   ```
2. Start the FastAPI server:
   ```bash
   python -m uvicorn app.main:app --app-dir backend --port 8000 --reload
   ```
3. Verify the backend is running:
   - **Interactive API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Health Check**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

### Step 3: Run the Frontend Application

1. In a separate terminal in the project root:
   ```bash
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to:
   - **Local Web App**: [http://localhost:5173](http://localhost:5173)

---

## 6. Running Automated Tests

Run the full backend test suite containing 22 unit, security, and integration tests:

```bash
pytest backend/tests/ -v
```

### Test Coverage Highlights:
- **`test_encryption.py`**: Verifies AES-256-GCM confidentiality, tamper prevention, plaintext backward-compatibility, and multi-key fallback.
- **`test_progress_trends.py`**: Validates chronological progress history, step deltas, and all smart goal prioritization rules.
- **`test_auto_goals.py`**: Tests fuzzy goal deduplication and automatic goal creation.
- **`test_unit.py`**: Tests user repository isolation, health checks, CRUD endpoints, and deterministic activity matching.
