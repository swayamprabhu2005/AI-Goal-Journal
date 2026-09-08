# Cloud Deployment & Hosting Cost Architecture

> **AI Goal Journal & Accountability Coach**  
> *Documentation Directory*: `docs/deployment_costs.md`  
> *Focus*: Hosting Platforms, Server Compute, Database Infrastructure, Docker Containerization, Custom Domains, and Manual Deployment Guide  
> *Target*: Local MVP $\rightarrow$ Production Cloud $\rightarrow$ Scale (100k MAU)  
> *Last Updated*: September 2026

---

## 1. Deployment Architecture Overview

The AI Goal Journal application is structured into a decoupled client-server architecture designed for high availability, low operational complexity, and near-zero initial hosting overhead:

```mermaid
graph TD
    Client["User Browser / Mobile Web"]
    
    subgraph EdgeCDN["Edge CDN Layer (100% Free / Global)"]
        Vercel["Vercel / Netlify / Cloudflare Pages<br/>React 18 + Vite Static SPA<br/>Global Anycast CDN + Auto SSL"]
    end
    
    subgraph Compute["Backend Compute Layer ($0 - $7/mo)"]
        Render["Render / Railway / Hetzner VPS<br/>FastAPI + Uvicorn<br/>faster-whisper Tiny (CPU INT8)<br/>Python 3.10+ Container"]
    end
    
    subgraph Data["Database & Storage Layer ($0 - $19/mo)"]
        Postgres["Neon Serverless / Supabase / Docker PostgreSQL<br/>AES-256-GCM Encrypted Tables<br/>Daily Automated Backups"]
    end
    
    subgraph External["External Cloud Services ($0 - $3/mo)"]
        Firebase["Firebase Auth (Spark Tier - Free up to 50k MAU)"]
        Gemini["Google Gemini API (gemini-3.1-flash-lite)"]
    end
    
    Client -->|HTTPS / Static Assets| Vercel
    Client -->|Bearer Token REST API| Render
    Render -->|Verify ID Token| Firebase
    Render -->|Encrypted SQL| Postgres
    Render -->|1-Shot Structured JSON| Gemini
```

---

## 2. Platform-by-Platform Hosting & Infrastructure Costs

### 2.1 Frontend Hosting (Static Single Page Application)

The frontend is built with React 18 and Vite 5, compiling to static HTML, JavaScript, and CSS bundles (`dist/`).

| Provider | Free Tier Allowance | Paid / Overage Rate | Best Use Case | Team Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **Vercel** | 100 GB bandwidth/mo, unlimited preview deployments, automatic SSL | $20/month per seat (Pro) | Fastest Git-integrated deployment for React/Vite | **Recommended (Default)** |
| **Cloudflare Pages** | **Unlimited bandwidth**, unlimited requests, 500 builds/mo | $20/month (Pro) | Extreme traffic resilience, zero risk of bandwidth bill shock | **Top Alternative** |
| **Netlify** | 100 GB bandwidth/mo, 300 build mins/mo | $19/month per member | Clean Git CI/CD, deploy previews | Fully Supported |
| **Self-Hosted Nginx** | Included with VPS ($0 marginal) | Included with VPS | When running monolithic Docker Compose on VPS | Great for Docker stage |

### 2.2 Backend Compute Hosting (FastAPI + faster-whisper Tiny)

The backend runs FastAPI with Uvicorn and an embedded CPU-only INT8 quantized `faster-whisper` Tiny singleton. RAM requirement is approximately **350 MB – 500 MB** under active transcription load.

| Platform | Tier | Monthly Price | Specs | Spin-Down Behavior | Team Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Render** | Free Web Service | **$0.00** | 512 MB RAM, 0.1 CPU | Spins down after 15 min of inactivity (50s cold start) | **Best for Testing / Demos** |
| **Render** | Starter Instance | **$7.00** | 1 GB RAM, 0.5 CPU | **Always ON**, zero cold starts, handles concurrent STT | **Recommended for Production MVP** |
| **Railway** | Hobby | **~$5.00** (usage-based) | Pay per vCPU/RAM consumed | Always ON, generous $5 free monthly credit initially | **Great Alternative** |
| **Fly.io** | Hobby / Free | **$0.00 – $5.00** | 256 MB – 1 GB shared CPU | 3 shared-cpu-1x VMs free, microVM container isolation | Fully Supported |
| **Hetzner Cloud VPS** | CX22 | **€3.79 (~$4.15)** | 2 vCPU (x86), 4 GB RAM, 40 GB NVMe, 20 TB traffic | Full root Linux server, runs Docker Compose effortlessly | **Best Value for High Scale** |
| **DigitalOcean** | Basic Droplet | **$6.00 – $12.00** | 1–2 GB RAM, 1 vCPU, 25–50 GB SSD | Dedicated IP, 1-click Docker marketplace | Reliable Alternative |

### 2.3 Database Hosting: Managed PostgreSQL vs Self-Hosted Docker

| Strategy | Provider / Setup | Free Tier Limit | Paid Cost Beyond Free | Backup & Maintenance | Security & Compliance |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Serverless Managed** | **Neon Postgres** | 0.5 GB storage, 1 project | $19.00/mo (Launch, 10 GB storage) | Automated PITR backups, instant branching | Enterprise SSL, zero maintenance |
| **Managed Cloud** | **Supabase** | 500 MB database, 2 projects | $25.00/mo (Pro, 8 GB storage) | Daily backups, dashboard GUI | Built-in SSL, connection pooling |
| **Self-Hosted Docker** | `postgres:16-alpine` on VPS | Unlimited (bounded by VPS disk) | **$0.00** (included in VPS cost) | Automated shell script with `pg_dump` to Cloudflare R2 / S3 | Field-level AES-256-GCM encryption isolates data |

---

## 3. Docker Containerization & Self-Hosting Architecture

When the team chooses to transition from serverless tiers to a unified containerized deployment, the entire stack can be hosted on a single **$4.15/month VPS (Hetzner CX22)** or **$6.00/month Droplet (DigitalOcean)** using Docker Compose.

### 3.1 Multi-Container Docker Compose Topology

```mermaid
graph LR
    subgraph VPS["Single Linux VPS ($4.15 - $6.00/mo)"]
        Nginx["Nginx Reverse Proxy<br/>(Port 80/443 + Certbot SSL)"]
        API["FastAPI Backend Container<br/>(Port 8000, 500MB RAM limit)"]
        DB["PostgreSQL 16 Container<br/>(Port 5432, 250MB RAM limit)"]
        Volume[("Persistent Docker Volume<br/>/var/lib/postgresql/data")]
    end
    
    Internet((Internet Traffic)) -->|HTTPS| Nginx
    Nginx -->|Proxy /api| API
    API -->|Internal Network| DB
    DB --> Volume
```

### 3.2 Resource Budgeting for Docker Host

On a standard 2-vCPU / 4 GB RAM VPS:
- **FastAPI + Whisper Container**: ~400 MB RAM (idle ~90 MB, active audio transcription peak ~380 MB).
- **PostgreSQL 16 Container**: ~150 MB RAM (configured with `shared_buffers = 128MB`).
- **Nginx Reverse Proxy & Certbot**: ~25 MB RAM.
- **Linux OS & System Overhead**: ~300 MB RAM.
- **Total System RAM Consumed**: **~875 MB out of 4,096 MB** (<22% capacity, leaving ample headroom for scaling).

---

## 4. Networking, Domain, and SSL Overhead

| Item | Provider | Cost | Notes |
| :--- | :--- | :--- | :--- |
| **Custom Domain Name** | Cloudflare Registrar / Namecheap | **$9.00 – $12.00 / year** | E.g., `goaljournal.ai` or `goaljournal.app`. Zero markup on Cloudflare Registrar. |
| **SSL / TLS Certificate** | Let's Encrypt / Cloudflare | **$0.00 (Free)** | Automated renewal via Certbot or Edge CDN. |
| **DNS Management & DDoS** | Cloudflare Free Tier | **$0.00 (Free)** | Fast Anycast DNS, HTTP/3 support, automated DDoS protection. |
| **Network Egress (Bandwidth)** | Vercel (100GB), Hetzner (20TB) | **$0.00** | Text API responses are <5 KB gzip; monthly bandwidth will not exceed free limits. |

---

## 5. Progressive Scaling Tiers & Total Monthly Budgets

The following tiers reflect the **pure hosting and server infrastructure costs** (independent of LLM token consumption):

```mermaid
graph LR
    Tier0["Stage 0: Demo / MVP<br/>0 - 100 MAU<br/>Hosting: $0.00/mo"]
    Tier1["Stage 1: Production Launch<br/>1,000 MAU<br/>Hosting: $7.00/mo"]
    Tier2["Stage 2: Growth Stage<br/>10,000 MAU<br/>Hosting: $25.00 - $35.00/mo"]
    Tier3["Stage 3: Scale Stage<br/>50,000 MAU<br/>Hosting: $70.00 - $90.00/mo"]
    Tier4["Stage 4: High Scale<br/>100,000 MAU<br/>Hosting: $150.00 - $180.00/mo"]

    Tier0 --> Tier1 --> Tier2 --> Tier3 --> Tier4
```

### Stage 0: 100% Free Tier (Prototype & College Showcase)
- **Target Audience**: 0 – 100 users, team testing, academic evaluation.
- **Frontend**: Vercel Hobby ($0.00)
- **Backend**: Render Free Web Service ($0.00)
- **Database**: In-Memory or Neon Postgres Free Tier ($0.00)
- **Domain & SSL**: Default `*.vercel.app` & `*.onrender.com` with free SSL ($0.00)
- **Total Monthly Hosting Cost**: **$0.00 / month**

### Stage 1: Production MVP (1,000 Active Users)
- **Target Audience**: Early adopters, consistent daily users.
- **Frontend**: Vercel Hobby ($0.00)
- **Backend**: Render Starter ($7.00/mo) — guarantees continuous uptime, eliminating cold starts.
- **Database**: Neon Postgres Free Tier ($0.00, database size < 150 MB).
- **Domain**: Custom domain ($0.85/mo amortized).
- **Total Monthly Hosting Cost**: **~$7.85 / month**

### Stage 2: Growth Stage (10,000 Active Users)
- **Target Audience**: Growing community, regular daily voice reflections.
- **Frontend**: Cloudflare Pages ($0.00, unlimited bandwidth).
- **Backend**: 2x Render Standard or 1x Hetzner CX32 (4 vCPU, 8 GB RAM) ($12.00 – $25.00/mo).
- **Database**: Neon Launch or Supabase Pro ($19.00/mo, 10 GB encrypted storage).
- **Total Monthly Hosting Cost**: **~$25.00 – $35.00 / month**

### Stage 3: Scale Stage (50,000 Active Users)
- **Frontend**: Vercel Pro ($20.00/mo, commercial license & team collaboration).
- **Backend Compute**: Hetzner Dedicated / AWS App Runner auto-scaling containers ($50.00/mo).
- **Database**: Managed High-Availability PostgreSQL with automated daily snapshots ($40.00/mo).
- **Total Monthly Hosting Cost**: **~$70.00 – $90.00 / month**

### Stage 4: Enterprise Scale (100,000 Active Users)
- **Frontend**: Vercel Pro + Cloudflare CDN Enterprise cache rules ($20.00/mo).
- **Backend Compute**: Clustered multi-node Docker Swarm / Kubernetes ($100.00/mo).
- **Database**: Primary-Replica High-Availability PostgreSQL cluster ($60.00/mo).
- **Total Monthly Hosting Cost**: **~$160.00 – $180.00 / month**

---

## 6. Actionable Manual Deployment Guide for the Team

Team members can deploy this project manually with zero initial cost following these concrete steps:

### Option A: 100% Free Instant Deployment (Recommended for MVP)

#### Step 1: Deploy Frontend to Vercel
1. Push the repository to GitHub.
2. Log in to [Vercel](https://vercel.com/) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Set the build configuration:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (or leave blank)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Frontend Environment Variables:
   - `VITE_FIREBASE_API_KEY`: *(From your Firebase console)*
   - `VITE_FIREBASE_AUTH_DOMAIN`: *(From your Firebase console)*
   - `VITE_FIREBASE_PROJECT_ID`: *(From your Firebase console)*
   - `VITE_FIREBASE_STORAGE_BUCKET`: *(From your Firebase console)*
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`: *(From your Firebase console)*
   - `VITE_FIREBASE_APP_ID`: *(From your Firebase console)*
6. Click **Deploy**. Your frontend will be live at `https://<your-project>.vercel.app`.

#### Step 2: Deploy Backend to Render
1. Log in to [Render](https://render.com/) and click **"New" $\rightarrow$ "Web Service"**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Runtime**: Python 3
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free
4. Add Backend Environment Variables:
   - `GEMINI_API_KEY`: *(From Google AI Studio)*
   - `GEMINI_MODEL`: `gemini-3.1-flash-lite`
   - `FIREBASE_PROJECT_ID`: *(Same as frontend)*
   - `ENCRYPTION_KEY`: *(Generate using `python -c "from cryptography.fernet import Fernet; import os, base64; print(base64.urlsafe_b64encode(os.urandom(32)).decode())"`)*
   - `WHISPER_MODEL`: `tiny`
   - `WHISPER_DEVICE`: `cpu`
   - `WHISPER_COMPUTE_TYPE`: `int8`
5. Click **Create Web Service**. Note your backend URL: `https://<backend-app>.onrender.com`.

#### Step 3: Link Frontend to Backend
1. In `src/services/api.js`, ensure the `BASE_URL` points to `https://<backend-app>.onrender.com/api/v1` in production (or configure `VITE_API_BASE_URL`).
2. Add your Vercel URL to CORS in `backend/app/main.py` if not already wildcarded.

---

### Option B: Dockerized Deployment with PostgreSQL on VPS ($4.15/mo)

For the future phase when transitioning to PostgreSQL and Docker:

1. **Provision a Linux VPS** (Hetzner CX22 or DigitalOcean 1GB Droplet with Ubuntu 24.04).
2. **Install Docker & Docker Compose**:
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose
   ```
3. **Clone the Repo & Create `.env`**:
   ```bash
   git clone <repo-url> /opt/goal-journal
   cd /opt/goal-journal
   # Configure backend .env with DATABASE_URL=postgresql://user:password@postgres:5432/goaljournal
   ```
4. **Launch the Stack**:
   ```bash
   docker-compose up -d --build
   ```
5. **Attach Certbot for Free SSL**:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```
