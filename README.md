# AI Goal Journal & Accountability Coach

An intelligent personal journaling and goal-tracking platform tailored for students, working professionals, freelancers, and entrepreneurs. The application eliminates manual tracking overhead by using local speech-to-text and AI semantic reasoning to transform daily conversational reflections into structured activities, active blockers, progress indicators, and weekly accountability coaching insights.

---

## 1. Directory & Folder Architecture

The codebase is organized into top-level modules:

```text
AI-GOAL-JOURNAL/
├── src/                          # React 18 SPA (Components, Pages, Context, Services)
│   ├── components/               # Reusable UI components (Sidebar, VoiceRecorder, Framer Motion)
│   ├── context/                  # React AuthContext & DataContext
│   ├── pages/                    # App pages (Dashboard, Journal, Goals, Progress, AiCoach, Insights, Profile, Settings)
│   ├── services/                 # API client (api.js) and Firebase auth wrappers
│   ├── App.jsx                   # React Router DOM 6 route declarations
│   ├── main.jsx                  # Application entry point
│   └── index.css                 # Bright Light Theme styling tokens
├── backend/                      # FastAPI Python Application
│   ├── app/
│   │   ├── api/v1/               # REST API endpoints (users, journals, goals, progress, summaries)
│   │   ├── core/                 # Auth verification & config settings
│   │   ├── database/             # SQLAlchemy connection & ORM entity models (app.db fallback)
│   │   ├── models/               # Domain dataclass representations
│   │   ├── repositories/         # Thread-safe auto-provisioning SQLite/PostgreSQL repositories
│   │   ├── schemas/              # Pydantic request/response validation schemas
│   │   ├── services/             # Business services (Whisper, Gemini, Goals, Journals, Productivity, Coach)
│   │   └── main.py               # FastAPI application entry & CORS middleware
│   └── alembic/                  # Database migration scripts
├── docs/                         # Specifications & Privacy Architecture
│   ├── ENCRYPTION_PRIVACY_RESEARCH.md  # AES-256-GCM envelope encryption & HIPAA guidelines
│   ├── PRODUCTIVITY_SCORE_SPEC.md     # Personal Productivity Score (0-100) formula spec
│   ├── COST_ANALYSIS.md               # Gemini Flash-Lite & local Whisper cost analysis
│   └── PROJECT_CONTEXT.md             # Project background, status matrix, and roadmap
├── Progress_Value_Calculation_and_HIPAA_Compliance_Report.docx # Detailed Technical Spec & HIPAA Report
├── index.html                    # HTML template
├── package.json                  # Frontend npm dependencies (framer-motion, lucide-react, firebase, react)
├── vite.config.js                # Vite 5 bundle configuration
├── tailwind.config.js            # Bright Light Theme palette configuration
├── .env                          # Local environment variables
├── .gitignore                    # Version control exclusions for frontend & backend
├── AGENTS.md                     # Root agent contract and DOX index
├── README.md                     # Project documentation
└── run.bat                       # 1-Click launcher script (starts backend & frontend)
```

---

## 2. System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                       React SPA (src/)                      │
│  - Bright, High-Contrast Light Theme UI (Teal & Slate)      │
│  - Framer Motion UI Animations & Responsive Layouts         │
│  - MediaRecorder Voice Capture with Whisper Transcriber     │
│  - Pages: Dashboard, Progress, Goals, Journal, AI Coach,    │
│    Insights, Profile, Settings                              │
└──────────────────────────────┬──────────────────────────────┘
                               │ Authorization: Bearer <Firebase ID Token>
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Backend (backend/)                │
│  - Firebase ID Token Verification via Google Public Certs   │
│  - REST API Routers: /users, /journals, /goals, /summaries  │
│  - Multi-Factor Accurate Progress Calculation Engine        │
│  - Personal Productivity Score Engine (0-100)               │
│  - Velocity & Estimated Completion Days Engine              │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────┐  ┌─────────────────────────────┐
│       faster-whisper        │  │      Google Gemini API      │
│  - Model: tiny (~75 MB)     │  │  - SDK: google-genai        │
│  - Execution: CPU + INT8    │  │  - Model: gemini-3.1-flash-lite
│  - Ephemeral Audio Cleanup  │  │  - Smart Extraction Fallback│
└─────────────────────────────┘  └─────────────────────────────┘
```

---

## 3. Technology Stack

- **Frontend**: React 18, Vite 5, Tailwind CSS 3 (Bright Teal & Slate Light Theme), Framer Motion 11, Lucide React 0.395, React Router DOM 6.
- **Backend**: FastAPI, Python 3.10+, Uvicorn, SQLAlchemy.
- **Authentication**: Firebase Authentication (Modular SDK + Backend ID Token verification via Google X509 public certificates).
- **Speech-to-Text**: `faster-whisper` (Model: `tiny`, Device: `cpu`, Compute: `int8`).
- **AI Engine**: Google Gemini API (`gemini-3.1-flash-lite` via `google-genai` Python SDK + Local Smart Extraction Fallback).
- **Persistence**: Auto-provisioning SQLite/PostgreSQL repository layer with strict per-user data isolation.

---

## 4. Key Platform Features & Technical Specifications

1. **Accurate Progress AI Engine**:
   - Calculates progress increments based on extracted quantitative units ($P = \frac{\text{completed}}{\text{total}} \times 100$) or damped effort levels ($+5\%$, $+15\%$, $+25\%$, $100\%$) with a $30\%$/day safety dampener.
   - Calculates daily goal velocity ($V$) and remaining completion days ($\text{Est: } \sim X \text{ days left}$).
2. **Personal Productivity Score (0–100)**:
   - Evaluates daily completed tasks ($35\%$), goal milestone progress ($30\%$), journaling consistency ($20\%$), and blocker penalties ($-15\%$).
3. **One-Click Auto-Goal Creation**:
   - AI extracts candidate goals from reflections; users can accept candidate goals with a single click inside the AI Journal Insights banner.
4. **Reflection Archive Pagination & Static Workspace**:
   - 6-item stateful pagination for past reflections with Next/Prev and page selectors.
5. **HIPAA Security & Word Specification Report**:
   - Includes full Word report: `Progress_Value_Calculation_and_HIPAA_Compliance_Report.docx`.
   - Audio files are stored temporarily and immediately deleted after transcription. Application-layer envelope encryption (AES-256-GCM) protecting user reflections.

---

## 5. Quick Start

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **Python**: `3.10+`

### 🚀 1-Click Launcher (Windows)

Simply double-click [`run.bat`](file:///d:/MyFiles/AI-GOAL-JOURNAL/run.bat) in the root directory. It will:
1. Start the FastAPI backend server on `http://127.0.0.1:8000` from `backend/`.
2. Start the React Vite dev server on `http://localhost:5173` from root `AI-GOAL-JOURNAL/`.
3. Open your web browser automatically to `http://localhost:5173`.

### Manual Launcher Steps

#### 1. Backend Server
```bash
python -m uvicorn app.main:app --app-dir backend --port 8000
```

#### 2. Frontend Application
```bash
npm install
npm run dev
```
