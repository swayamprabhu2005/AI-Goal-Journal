from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.users import router as users_router
from app.api.v1.goals import router as goals_router
from app.api.v1.journals import router as journals_router
from app.api.v1.summaries import router as summaries_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for AI Goal Journal & Accountability Coach",
    version="1.0.0",
)

# CORS middleware for React Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
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