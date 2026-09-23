import os
import logging
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger(__name__)

# Root directory: AI-GOAL-JOURNAL/
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
ENV_FILE = ROOT_DIR / ".env"

load_dotenv(ENV_FILE)

DATABASE_URL = os.getenv("DATABASE_URL") or "sqlite:///./app.db"

# Normalize postgres:// to postgresql:// for SQLAlchemy compatibility (Neon / Render)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# If PostgreSQL is requested, ensure sslmode=require for NeonDB / cloud providers
if DATABASE_URL.startswith("postgresql"):
    if "neon.tech" in DATABASE_URL and "sslmode" not in DATABASE_URL:
        sep = "&" if "?" in DATABASE_URL else "?"
        DATABASE_URL = f"{DATABASE_URL}{sep}sslmode=require"
    connect_args = {
        "connect_timeout": 30,
    }
else:
    connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

try:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300 if DATABASE_URL.startswith("postgresql") else -1,
        connect_args=connect_args,
    )
except Exception as e:
    logger.warning("Failed to create engine with DATABASE_URL, falling back to SQLite: %s", e)
    engine = create_engine(
        "sqlite:///./app.db",
        pool_pre_ping=True,
        connect_args={"check_same_thread": False},
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def init_db():
    try:
        import app.database.orm_models  # Register ORM models
        Base.metadata.create_all(bind=engine)
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        if "journals" in inspector.get_table_names():
            cols = [c["name"] for c in inspector.get_columns("journals")]
            with engine.begin() as conn:
                if "detected_mood" not in cols:
                    conn.execute(text("ALTER TABLE journals ADD COLUMN detected_mood VARCHAR"))
                if "mood_confidence" not in cols:
                    conn.execute(text("ALTER TABLE journals ADD COLUMN mood_confidence FLOAT"))
                if "trigger_keywords" not in cols:
                    col_type = "JSONB" if "postgresql" in engine.dialect.name else "JSON"
                    conn.execute(text(f"ALTER TABLE journals ADD COLUMN trigger_keywords {col_type}"))
    except Exception as e:
        print(f"Database init note: {e}")
# init_db is invoked during application lifespan startup to avoid blocking imports
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()