import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Root directory: AI-GOAL-JOURNAL/
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
ENV_FILE = ROOT_DIR / ".env"

load_dotenv(ENV_FILE)

DATABASE_URL = os.getenv("DATABASE_URL") or "sqlite:///./app.db"

# If PostgreSQL is requested, verify server is actually reachable; otherwise fallback to SQLite
if DATABASE_URL.startswith("postgresql"):
    try:
        import psycopg2
        test_conn = psycopg2.connect(DATABASE_URL, connect_timeout=1)
        test_conn.close()
        connect_args = {}
    except Exception as exc:
        print(f"[DB] PostgreSQL unreachable ({exc}). Falling back to local SQLite database.")
        DATABASE_URL = "sqlite:///./app.db"
        connect_args = {"check_same_thread": False}
else:
    connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

try:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        connect_args=connect_args,
    )
except Exception:
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

init_db()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()