# COST_ANALYSIS.md — AI Goal Journal & Accountability Coach

> **Document Purpose**: Detailed breakdown of project cost factors, comparing the Current Local Development Phase with Future Production Deployment, documenting architectural cost-control decisions, and providing official reference links.  
> **Verification Date**: August 2026

---

## 1. Overview Comparison Table

| Component | Technology / Service | Current Development Phase Cost | Potential Future Production Cost | Key Notes & References |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Framework** | React 18 + Vite 5 + Tailwind CSS 3 | **$0.00** (Open Source) | **$0.00** (Open Source) | MIT License; static client bundle. |
| **Frontend Hosting** | Localhost (Vite dev server) | **$0.00** | **$0.00 - $20.00/mo** | Can be hosted on Vercel, Netlify, Cloudflare Pages, or Firebase Hosting free/hobby tiers. |
| **Backend Framework** | FastAPI + Python 3.10+ + Uvicorn | **$0.00** (Open Source) | **$0.00** (Open Source) | MIT License; high-concurrency async ASGI server. |
| **Backend Hosting** | Localhost (Uvicorn server) | **$0.00** | **$5.00 - $25.00/mo** | Container or VM hosting (e.g., Render, Railway, Google Cloud Run, AWS App Runner). |
| **Authentication** | Firebase Authentication | **$0.00** (Subject to plan limits) | **$0.00 - Usage-based** | No-cost tier under Spark plan; Blaze pay-as-you-go applies if scaling beyond thresholds. |
| **Speech-to-Text** | `faster-whisper` (Tiny model, CPU) | **$0.00** (Self-hosted locally) | **$0.00** (Included in server CPU) | Zero per-minute API fees. Eliminates paid Whisper APIs ($0.006/min saved). |
| **AI Intelligence** | Google Gemini API (`gemini-3.1-flash-lite`) | **Pay-as-you-go / Free tier** (Minimal usage) | **~$0.10 - $0.40 per 1M tokens** | Low-cost Flash-Lite model optimized for high throughput and structured JSON. |
| **Database Persistence** | In-Memory (Current) $\rightarrow$ PostgreSQL (Future)| **$0.00** (In-Memory) | **$0.00 - $25.00/mo** | In-memory storage for MVP; managed PostgreSQL (Supabase, Neon, AWS RDS) for production. |
| **Developer Tooling** | Node.js, Python, Git, VS Code | **$0.00** | **$0.00** | Standard free open-source developer tooling. |

---

## 2. Current Development Phase Breakdown

During the current local development and college demonstration phase, overall expenditures are kept close to **$0.00**:

1. **Local Compute & Hosting ($0.00)**:
   - React frontend runs on Vite at `http://localhost:5173`.
   - FastAPI backend runs on Uvicorn at `http://127.0.0.1:8000`.
   - Persistence is managed completely in-memory using thread-safe data structures.
2. **Local Speech-to-Text ($0.00)**:
   - The `faster-whisper` Tiny model (~75 MB) runs locally on CPU with INT8 quantization.
   - Requires zero external speech API subscriptions or OpenAI Whisper API credits.
3. **Authentication ($0.00)**:
   - Utilizes standard Firebase Authentication for Email/Password sign-ins within applicable development limits.
4. **AI Reasoning (Minimal Variable Cost)**:
   - Journal extraction and weekly summaries use `gemini-3.1-flash-lite`.
   - Costs during development are minimal or covered by standard Google AI Developer API free/evaluation quotas.

---

## 3. Cost-Control Architectural Decisions

To ensure the project remains sustainable and cost-effective, specific architectural guardrails have been implemented:

1. **Self-Hosted Whisper Tiny instead of Paid Cloud STT**:
   - Cloud speech APIs (e.g., OpenAI Whisper API at $0.006/minute or Google Cloud Speech-to-Text) incur linear per-minute fees.
   - Running `faster-whisper` Tiny locally on CPU incurs **zero marginal cost per voice entry**.
2. **Targeted Single-Call Journal Extraction**:
   - The application bundles mood analysis, activity classification, blocker detection, and goal hints into **a single structured Gemini call per journal entry**.
   - Retries are bounded and explicit. The application does NOT execute repetitive or recursive AI calls.
3. **Deterministic Logic for Non-Semantic Metrics**:
   - Streaks, goal counts, completion percentages, and status checks are computed strictly by deterministic Python backend logic, avoiding wasteful LLM token consumption.
4. **On-Demand Weekly Summaries**:
   - Weekly AI coaching summaries are synthesized only when explicitly requested by the user, preventing scheduled background jobs from generating unused AI tokens.
5. **Zero Token Overhead in Automated Testing**:
   - The automated unit test suite (`pytest`) uses mocks and test doubles. Running test suites consumes **0 Gemini tokens** and loads **0 Whisper models**.

---

## 4. Future Production Deployment Considerations

When moving to a public multi-user cloud deployment, the following cost factors should be planned:

### A. Authentication Tiers
- **Firebase Spark Plan**: No-cost plan subject to applicable Firebase limits (e.g., up to 50,000 monthly active users for email/password authentication).
- **Firebase Blaze Plan**: Pay-as-you-go plan required for certain integrations or exceeding free-tier limits.
- **Identity Platform Upgrade**: If enterprise multi-factor authentication or SAML/OIDC is needed, additional per-MAU costs apply.
- *Official Reference*: [Firebase Pricing Guide](https://firebase.google.com/pricing)

### B. AI Model Inference Costs
- **Google Gemini Flash-Lite**:
  - Input tokens: ~$0.075 to $0.15 per 1,000,000 tokens (subject to active Google pricing).
  - Output tokens: ~$0.30 to $0.60 per 1,000,000 tokens.
  - At an average of 500 input tokens and 200 output tokens per journal, 1,000 journal entries cost approximately **$0.15 - $0.20 total**.
- *Official Reference*: [Google AI for Developers Pricing](https://ai.google.dev/pricing)

### C. Managed Database & Backend Compute
- **Managed PostgreSQL**: Options include Supabase (free hobby tier up to 500 MB, then $25/mo), Neon Serverless Postgres (free tier up to 0.5 GB), or AWS RDS.
- **Backend Server Compute**: CPU instance with 1-2 vCPUs and 2 GB RAM (e.g., Render Web Service at $7/mo, or Google Cloud Run scale-to-zero compute) to run FastAPI and `faster-whisper` Tiny.

---

## 5. Pricing & Quota Disclaimers

> [!IMPORTANT]
> 1. **No Permanent Free Guarantees**: API pricing, free-tier thresholds, and quota policies for Google Cloud, Firebase, and third-party hosting providers can change at any time.
> 2. **Verification Requirement**: All cost projections must be validated against official vendor pricing pages prior to deploying production infrastructure.
> 3. **Information Currency**: Pricing details in this document are verified as of August 2026.
