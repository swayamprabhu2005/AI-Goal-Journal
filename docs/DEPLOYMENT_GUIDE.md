# AI Goal Journal & Accountability Coach — Deployment Guide

## Complete Step-by-Step Deployment on Vercel, Render, and NeonDB

> **Project:** AI Goal Journal & Accountability Coach  
> **Team:** Aditya, Farah, Panshobh, Sheryl, Swayam  
> **Date:** September 23, 2026  
> **Status:** Live and Fully Deployed

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [NeonDB (PostgreSQL Database) — Setup Steps](#3-neondb-postgresql-database--setup-steps)
4. [Render (Backend FastAPI) — Deployment Steps](#4-render-backend-fastapi--deployment-steps)
5. [Vercel (Frontend React SPA) — Deployment Steps](#5-vercel-frontend-react-spa--deployment-steps)
6. [Issues Faced and How We Rectified Them](#6-issues-faced-and-how-we-rectified-them)
7. [Environment Variables Reference](#7-environment-variables-reference)
8. [Verification & Health Checks](#8-verification--health-checks)
9. [AI Inference Layer & Fallback Hierarchy](#9-ai-inference-layer--fallback-hierarchy)

---

## 1. Architecture Overview

```
       ┌────────────────────────────────────────────────────────┐
       │                 Vercel Edge Network                     │
       │   React 18 + Vite SPA (Tailwind CSS, Client Cache)      │
       │   URL: https://ai-goal-journal.vercel.app               │
       └───────────────────────────┬────────────────────────────┘
                                   │ HTTPS / REST API
                                   │ (Firebase JWT Auth Token)
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │                   Render Web Service                    │
       │   FastAPI (Python 3.11) + Uvicorn + Whisper CPU         │
       │   URL: https://ai-goal-journal-backend.onrender.com     │
       └──────────────┬──────────────────────────┬──────────────┘
                      │                          │
         SQLAlchemy   │                          │  Google GenAI SDK
       (Pool Pre-Ping)│                          │  Groq Cloud API
                      ▼                          ▼
       ┌──────────────────────────┐   ┌──────────────────────────┐
       │     NeonDB PostgreSQL    │   │      AI Model Layer      │
       │  Serverless PG 16 Pooler │   │  Gemini 2.5 Flash        │
       │  Region: us-east-2 AWS   │   │  Groq Qwen / Llama 3.3  │
       └──────────────────────────┘   │  Whisper (tiny, CPU)     │
                                      └──────────────────────────┘
```

| Component | Provider | URL |
|:---|:---|:---|
| Frontend | Vercel | `https://ai-goal-journal.vercel.app` |
| Backend API | Render | `https://ai-goal-journal-backend.onrender.com/api/v1` |
| Database | NeonDB | `ep-odd-cloud-b5ykpjhu-pooler.c-7.us-east-2.aws.neon.tech/neondb` |
| Auth | Firebase | Project `ai-goal-journal-54523` |

---

## 2. Prerequisites

Before beginning deployment, we ensured the following were in place:

1. **GitHub Account** — Both repositories pushed and accessible:
   - `github.com/swayamprabhu2005/AI-Goal-Journal` (deployment repo, `main` branch)
   - `github.com/farah123455/AI-GOAL-JOURNAL` (team repo, `completed` and `main` branches)
2. **Firebase Project** — Firebase Auth enabled with Google sign-in provider configured.
3. **Google Gemini API Key** — Obtained from Google AI Studio (`aistudio.google.com`).
4. **Groq API Key** — Obtained from `console.groq.com` for fast AI coaching responses.
5. **Node.js 18+** — For building the Vite frontend.
6. **Python 3.11+** — For the FastAPI backend.

---

## 3. NeonDB (PostgreSQL Database) — Setup Steps

### Step 1: Create a NeonDB Account and Project
1. Navigated to [neon.tech](https://neon.tech) and signed up with GitHub.
2. Created a new project named **AI Goal Journal**.
3. Selected region **US East 2 (Ohio)** for proximity to Render servers.
4. NeonDB automatically provisioned a serverless PostgreSQL 16 instance.

### Step 2: Obtain the Connection String
1. From the NeonDB dashboard → Connection Details panel.
2. Selected **Pooled connection** (uses PgBouncer for efficient connection multiplexing).
3. Copied the connection string in the format:
   ```
   postgresql://neondb_owner:<password>@ep-odd-cloud-b5ykpjhu-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 3: Configure in Backend
1. Set the `DATABASE_URL` environment variable on Render (see Section 4).
2. In `backend/app/db/postgres.py`, added automatic protocol normalization:
   ```python
   # NeonDB gives postgres:// but SQLAlchemy 2.0+ needs postgresql://
   if database_url.startswith("postgres://"):
       database_url = database_url.replace("postgres://", "postgresql://", 1)
   ```

### Step 4: Schema Creation
1. On first backend startup, SQLAlchemy's `Base.metadata.create_all(bind=engine)` automatically created all tables:
   - `users`, `journal_entries`, `goals`, `progress_updates`, `weekly_summaries`, `habits`, `habit_logs`, `roadmaps`
2. Created Alembic migration `backend/alembic/versions/add_journal_mood_columns.py` to add mood analysis columns (`detected_mood`, `mood_confidence`, `trigger_keywords`) to the `journal_entries` table.

### Step 5: Verify Connection
```bash
curl https://ai-goal-journal-backend.onrender.com/api/v1/health
```
Confirmed the health endpoint returns `"database_type": "postgresql"` and the correct NeonDB target host.

---

## 4. Render (Backend FastAPI) — Deployment Steps

### Step 1: Create a Render Account
1. Navigated to [render.com](https://render.com) and signed up with GitHub.

### Step 2: Create a New Web Service
1. Clicked **New → Web Service**.
2. Connected the GitHub repository: `swayamprabhu2005/AI-Goal-Journal`.
3. Configured the service:
   - **Name:** `ai-goal-journal-backend`
   - **Region:** Oregon (US West)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Step 3: Configure Environment Variables
Added the following environment variables in Render's dashboard:

| Variable | Value |
|:---|:---|
| `DATABASE_URL` | `postgresql://neondb_owner:<password>@ep-odd-cloud-...neon.tech/neondb?sslmode=require` |
| `GEMINI_API_KEY` | `AIzaSy...` (Google Gemini API key) |
| `GEMINI_MODEL` | `gemini-2.5-flash` |
| `GROQ_API_KEY` | `gsk_...` (Groq Cloud API key) |
| `FIREBASE_PROJECT_ID` | `ai-goal-journal-54523` |
| `ENCRYPTION_KEY` | *(32-byte base64 Fernet key for AES-256 journal encryption)* |
| `PYTHON_VERSION` | `3.11.9` |

### Step 4: Create render.yaml (Infrastructure as Code)
Created `render.yaml` in the project root for reproducible deployments:
```yaml
services:
  - type: web
    name: ai-goal-journal-backend
    runtime: python
    rootDir: backend
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.9
```

### Step 5: Deploy
1. Clicked **Create Web Service** in Render dashboard.
2. Render automatically pulled the code from GitHub `main`, ran `pip install`, and started the Uvicorn server.
3. The service was assigned the public URL: `https://ai-goal-journal-backend.onrender.com`.

### Step 6: Verify
```bash
curl -i https://ai-goal-journal-backend.onrender.com/api/v1/health
```
Confirmed `HTTP/1.1 200 OK` with status `"healthy"`, Gemini model connected, and NeonDB PostgreSQL active.

---

## 5. Vercel (Frontend React SPA) — Deployment Steps

### Step 1: Create a Vercel Account
1. Navigated to [vercel.com](https://vercel.com) and signed up with GitHub.

### Step 2: Import the Project
1. Clicked **Add New → Project**.
2. Selected the GitHub repository: `swayamprabhu2005/AI-Goal-Journal`.
3. Vercel auto-detected the Vite framework.

### Step 3: Configure Build Settings
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Step 4: Configure Environment Variables
Added the following environment variables in Vercel's dashboard:

| Variable | Value |
|:---|:---|
| `VITE_API_BASE_URL` | `https://ai-goal-journal-backend.onrender.com` |
| `VITE_FIREBASE_API_KEY` | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `ai-goal-journal-54523.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `ai-goal-journal-54523` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `ai-goal-journal-54523.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `839075778842` |
| `VITE_FIREBASE_APP_ID` | `1:839075778842:web:...` |

### Step 5: Create vercel.json (SPA Routing Fix)
Created `vercel.json` in the project root to handle client-side routing:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
Without this, refreshing any page like `/goals` or `/calendar` would return `404 NOT FOUND` because Vercel looks for physical HTML files.

### Step 6: Deploy
1. Clicked **Deploy** in Vercel.
2. Vercel ran `npm install`, then `npm run build`, then published the `dist/` folder to the CDN.
3. The app was assigned a public URL automatically.

### Step 7: Enable Auto-Deploy
Vercel automatically redeploys whenever a new commit is pushed to the `main` branch of the connected GitHub repository.

---

## 6. Issues Faced and How We Rectified Them

### Issue 1: SQLAlchemy Protocol Prefix Error (`postgres://` vs `postgresql://`)
- **Symptom:** Backend crashed immediately on startup with `NoSuchModuleError: Can't load plugin: sqlalchemy.dialects:postgres`.
- **Cause:** NeonDB provides connection strings starting with `postgres://`, but SQLAlchemy 2.0+ requires `postgresql://` as the dialect prefix.
- **Fix:** Added automatic normalization in `backend/app/db/postgres.py`:
  ```python
  if database_url.startswith("postgres://"):
      database_url = database_url.replace("postgres://", "postgresql://", 1)
  ```

### Issue 2: Serverless Connection Drops (SSL Disconnects)
- **Symptom:** After the backend ran for a few minutes, queries randomly failed with `OperationalError: SSL connection has been closed unexpectedly`.
- **Cause:** NeonDB's serverless compute suspends idle connections. SQLAlchemy reused stale sockets from the connection pool.
- **Fix:** Configured connection pool health validation in `backend/app/db/postgres.py`:
  ```python
  engine = create_engine(
      database_url,
      pool_pre_ping=True,       # Validates connections with SELECT 1 before each query
      pool_recycle=300,         # Recycles all connections every 5 minutes
      pool_size=10,
      max_overflow=20,
      connect_args={"sslmode": "require", "connect_timeout": 15},
  )
  ```

### Issue 3: Missing Database Columns (Schema Desynchronization)
- **Symptom:** Submitting journals crashed with `UndefinedColumn: column journal_entries.detected_mood does not exist`.
- **Cause:** The neural mood analyzer feature added new columns (`detected_mood`, `mood_confidence`, `trigger_keywords`) locally, but NeonDB hadn't been migrated.
- **Fix:**
  1. Created an Alembic migration script with idempotent column checks (using `inspector.get_columns()` to avoid errors if columns already exist).
  2. Added `Base.metadata.create_all(bind=engine)` in the FastAPI startup event to auto-create any missing tables on boot.

### Issue 4: Render Free-Tier Cold Starts (45–60 Second Delays)
- **Symptom:** When the app hadn't been used for 15+ minutes, the first API call took 45–60 seconds, causing the frontend to show empty states or timeout errors.
- **Cause:** Render's free tier spins down containers after 15 minutes of inactivity. The first request triggers a full container rebuild, Python import, and model loading.
- **Fix (Frontend Keep-Alive Heartbeat):** Added a 4-minute interval ping in `src/context/DataContext.jsx`:
  ```javascript
  setInterval(() => {
    fetch('https://ai-goal-journal-backend.onrender.com/api/v1/health', { method: 'GET' })
  }, 240000); // Every 4 minutes
  ```
- **Fix (Generous Timeout):** Increased the frontend fetch timeout to 300 seconds (5 minutes) so legitimate cold starts never abort.

### Issue 5: "Error: Failed to fetch" During Container Swap
- **Symptom:** User clicked "Analyze Entry" and got `Error: Failed to fetch`. The journal entry appeared lost.
- **Cause:** A git push to `main` triggered Render's automated rebuild. During the 15–25 second container handover, incoming HTTP connections were rejected.
- **Fix:** Implemented an automatic retry mechanism in `src/services/api.js`:
  ```javascript
  const maxRetries = options.retries ?? 1;
  while (attempt <= maxRetries) {
    try {
      return await fetch(...);
    } catch (err) {
      if ((err.message === 'Failed to fetch') && attempt <= maxRetries) {
        await new Promise(r => setTimeout(r, 1000)); // Wait 1 second
        continue; // Retry silently
      }
      throw err;
    }
  }
  ```

### Issue 6: Render Memory Crashes (OOMKilled)
- **Symptom:** Backend container was killed with Linux signal 9 shortly after startup.
- **Cause:** Loading `whisper-base` model + PyTorch exceeded the 512MB RAM limit on Render's free tier.
- **Fix:**
  - Switched to `whisper-tiny` model (39M parameters vs 74M).
  - Restricted PyTorch to single-threaded execution: `torch.set_num_threads(1)`.
  - Loaded Whisper model lazily on first voice request instead of during server startup.

### Issue 7: CORS Cross-Origin Rejections
- **Symptom:** Browser console showed `Access to fetch blocked by CORS policy: No 'Access-Control-Allow-Origin' header`.
- **Cause:** Vercel generates dynamic preview URLs (`ai-goal-journal-*-swayamprabhu.vercel.app`). A hardcoded CORS origin list couldn't match all possible subdomains.
- **Fix:** Configured regex-based CORS in `backend/app/main.py`:
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+",
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```

### Issue 8: 404 Not Found on Page Refresh (Vercel SPA Routing)
- **Symptom:** Directly navigating to `/goals`, `/calendar`, or `/goals/:id/roadmap` returned Vercel's `404: NOT_FOUND` page.
- **Cause:** Vercel serves static files. React Router handles routes client-side, but Vercel looked for physical HTML files at those paths.
- **Fix:** Created `vercel.json` in the project root:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```

### Issue 9: Data Disappearing on Hard Refresh (Ctrl+Shift+R)
- **Symptom:** Pressing `Ctrl+Shift+R` showed "No goals found", "0 habits", empty journal. Data reappeared after 3–5 seconds.
- **Cause:** Hard refresh cleared all React state. Firebase Auth re-initialization took 2–3 seconds before API calls could be made with valid tokens.
- **Fix (Stale-While-Revalidate Caching):** In `src/context/DataContext.jsx`:
  - Persisted all goals, habits, journals to `localStorage` on every successful fetch.
  - On mount, read data from `localStorage` immediately (0ms) so the UI never shows empty states.
  - Background API calls revalidate and update the cache silently.

### Issue 10: Slow Goal Updates & Deletion (1–2 Second Delay)
- **Symptom:** Marking a goal as "Completed" or deleting a goal had a visible 1–2 second lag before the UI updated.
- **Cause:** The frontend awaited the full network roundtrip to Render before updating React state.
- **Fix (Optimistic UI Updates):** In `src/pages/Goals.jsx`:
  - Update the UI cache **immediately (0ms)** before sending the API request.
  - Trigger celebration animations instantly.
  - If the network request fails, revert the UI and show an error toast.

### Issue 11: Roadmap Page Loading Slowly (Grey Skeleton Delay)
- **Symptom:** Navigating to a goal's roadmap showed 4 pulsing grey skeleton cards for 10–15 seconds.
- **Cause:** Roadmaps were cached only in an in-memory JavaScript `Map()` that reset on every page load. Additionally, goal ID type mismatch (`number` vs `string`) caused the goal title lookup to fail.
- **Fix:**
  - Added `localStorage` persistence in `src/services/roadmapApi.js` so cached roadmaps load instantly (0ms).
  - Fixed type-safe ID matching: `String(g.id) === String(goalId)`.
  - Added rich curriculum templates (AWS, Cloud, DevOps) in the backend fallback so common goals generate without waiting for Gemini API.

### Issue 12: Encrypted Text Showing in Journal History (`enc:v1:...`)
- **Symptom:** Journal history cards displayed raw encrypted strings like `enc:v1:DnshX8TwyxlAnZDIJdonTz...`.
- **Cause:** If the backend's encryption key rotated or decryption failed silently, the raw ciphertext was returned and rendered directly in the preview.
- **Fix:** In `src/pages/Journal.jsx`, added a content sanitizer:
  ```javascript
  {j.content && !j.content.startsWith("enc:v1:")
    ? j.content
    : (j.title || j.ai_analysis?.quick_summary || "Journal Reflection")}
  ```

### Issue 13: Firebase Token Verification Failures in Cloud
- **Symptom:** Authenticated users sometimes received `401 Unauthorized` from the backend despite being logged in.
- **Cause:** Firebase ID token audience (`aud`) field validation was strict, and Google's x509 certificate endpoint had intermittent delays.
- **Fix:** Implemented resilient public key caching with fallback audience verification in `backend/app/core/auth.py`.

---

## 7. Environment Variables Reference

### Frontend (Vercel Dashboard)

| Variable | Description |
|:---|:---|
| `VITE_API_BASE_URL` | Render backend URL (e.g., `https://ai-goal-journal-backend.onrender.com`) |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |

### Backend (Render Dashboard)

| Variable | Description |
|:---|:---|
| `DATABASE_URL` | NeonDB PostgreSQL pooled connection string |
| `GEMINI_API_KEY` | Google Gemini API Key |
| `GEMINI_MODEL` | Gemini model identifier (e.g., `gemini-2.5-flash`) |
| `GROQ_API_KEY` | Groq Cloud API Key for AI coaching |
| `FIREBASE_PROJECT_ID` | Firebase Project ID for token verification |
| `ENCRYPTION_KEY` | AES-256 Fernet key for journal encryption |
| `PYTHON_VERSION` | Python runtime version (e.g., `3.11.9`) |

---

## 8. Verification & Health Checks

### Backend Health Probe
```bash
curl -i https://ai-goal-journal-backend.onrender.com/api/v1/health
```

**Expected Response (HTTP 200):**
```json
{
  "status": "healthy",
  "service": "AI Goal Journal API",
  "whisper_model": "tiny",
  "whisper_device": "cpu",
  "gemini_model": "gemini-2.5-flash",
  "database_type": "postgresql",
  "database_target": "ep-odd-cloud-b5ykpjhu-pooler.c-7.us-east-2.aws.neon.tech/neondb"
}
```

### Frontend Build Verification
```bash
npm run build
```
Ensures all 2000+ modules bundle cleanly with zero syntax or packaging errors.

### Swagger API Documentation
```
https://ai-goal-journal-backend.onrender.com/docs
```
FastAPI's auto-generated OpenAPI/Swagger UI for testing all endpoints interactively.

---

## 9. AI Inference Layer & Fallback Hierarchy

The backend implements a multi-tiered AI architecture to guarantee responsiveness:

```
┌────────────────────────────────────────────────────────┐
│               AI Inference Priority                    │
├────────────────────────────────────────────────────────┤
│  Tier 1 (Primary):  Google Gemini 2.5 Flash            │
│    → Structured journal extraction (goals, blockers)   │
│    → AI learning roadmap generation                    │
│    → Mood keyword extraction                           │
├────────────────────────────────────────────────────────┤
│  Tier 2 (Speed):    Groq Cloud (Qwen / Llama 3.3)     │
│    → Sub-second AI accountability coaching chat        │
│    → Context-aware conversational responses            │
├────────────────────────────────────────────────────────┤
│  Tier 3 (Fallback): Rule-Based Engine                  │
│    → Zero-latency heuristic goal/blocker extraction    │
│    → Pre-configured curricula (AWS, Python, React)     │
│    → Guaranteed uptime with no API dependency          │
└────────────────────────────────────────────────────────┘
```

If Gemini is rate-limited or slow, Groq serves coaching; if both APIs fail, the rule-based fallback provides instant structured responses without any external network dependency.

---

## Summary

The deployment pipeline follows this flow:

1. **Developer pushes code** to GitHub `main` branch.
2. **Vercel** auto-detects the push and rebuilds the React SPA → deploys to CDN.
3. **Render** auto-detects the push and rebuilds the Python backend → restarts Uvicorn.
4. **NeonDB** requires no redeployment — it is a persistent serverless database.
5. **Firebase Auth** requires no redeployment — it is a managed Google service.

All three services (Vercel, Render, NeonDB) operate on free tiers, making the entire deployment zero-cost for development and demonstration purposes.

---

*This document was created as part of the AI Goal Journal & Accountability Coach project deployment.*
