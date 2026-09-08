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

@asynccontextmanager
async def lifespan(app: FastAPI):
    import threading
    from app.services.whisper_service import whisper_service
    threading.Thread(target=whisper_service.preload, daemon=True).start()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for AI Goal Journal & Accountability Coach",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False,
)

# CORS middleware for React Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex="http://.*",
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
    return {
        "status": "healthy",
        "service": "AI Goal Journal API",
        "whisper_model": settings.WHISPER_MODEL,
        "whisper_device": settings.WHISPER_DEVICE,
        "gemini_model": settings.GEMINI_MODEL,
        "persistence": "in-memory",
    }

# Mount v1 routers
app.include_router(users_router, prefix=settings.API_V1_PREFIX)
app.include_router(goals_router, prefix=settings.API_V1_PREFIX)
app.include_router(journals_router, prefix=settings.API_V1_PREFIX)
app.include_router(summaries_router, prefix=settings.API_V1_PREFIX)
app.include_router(progress_router, prefix=settings.API_V1_PREFIX)
app.include_router(habits_router, prefix=settings.API_V1_PREFIX)
app.include_router(productivity_router, prefix=settings.API_V1_PREFIX)