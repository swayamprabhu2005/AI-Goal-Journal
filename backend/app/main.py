from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.users import router as users_router
from app.api.v1.goals import router as goals_router
from app.api.v1.journals import router as journals_router
from app.api.v1.summaries import router as summaries_router
from app.api.v1.progress import router as progress_router
from app.api.v1.habits import router as habits_router
from app.api.v1.productivity import router as productivity_router
from app.api.v1.calendar import router as calendar_router
from app.api.v1.roadmap import router as roadmap_router
from app.api.v1.coach import router as coach_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Lightweight lifespan: models are lazy-loaded on demand to preserve 512MB RAM on cloud hosts
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for AI Goal Journal & Accountability Coach",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False,
)

import os

# CORS middleware for React Vite frontend (local and deployed on Vercel)
cors_origins = list(settings.CORS_ORIGINS)
if os.getenv("CORS_ORIGINS"):
    cors_origins.extend([o.strip() for o in os.getenv("CORS_ORIGINS").split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "AI Goal Journal & Accountability Coach API is running",
        "docs": "/docs",
        "health": "/api/v1/health",
    }

@app.get("/api/v1/health")
def health_check():
    from app.database.connection import engine
    db_dialect = engine.dialect.name
    masked_target = "sqlite-local"
    if hasattr(engine.url, "host") and engine.url.host:
        masked_target = f"{engine.url.host}/{engine.url.database}"
    return {
        "status": "healthy",
        "service": "AI Goal Journal API",
        "whisper_model": settings.WHISPER_MODEL,
        "whisper_device": settings.WHISPER_DEVICE,
        "gemini_model": settings.GEMINI_MODEL,
        "database_type": db_dialect,
        "database_target": masked_target,
    }

# Mount v1 routers
app.include_router(users_router, prefix=settings.API_V1_PREFIX)
app.include_router(goals_router, prefix=settings.API_V1_PREFIX)
app.include_router(journals_router, prefix=settings.API_V1_PREFIX)
app.include_router(summaries_router, prefix=settings.API_V1_PREFIX)
app.include_router(progress_router, prefix=settings.API_V1_PREFIX)
app.include_router(habits_router, prefix=settings.API_V1_PREFIX)
app.include_router(productivity_router, prefix=settings.API_V1_PREFIX)
app.include_router(calendar_router, prefix=settings.API_V1_PREFIX)
app.include_router(roadmap_router, prefix=settings.API_V1_PREFIX)
app.include_router(coach_router, prefix=settings.API_V1_PREFIX)