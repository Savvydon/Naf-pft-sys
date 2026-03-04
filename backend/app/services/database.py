import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# ────────────────────────────────────────────────
# Best practice: always read from environment variable (Render provides this automatically)
DATABASE_URL = os.getenv("DATABASE_URL")

# Only for local development — NEVER commit real credentials!
if not DATABASE_URL:
    # Use your actual external URL here as fallback (but ideally use a .env file locally instead)
    DATABASE_URL = (
        "postgresql+psycopg2://naf_pft_sys_user:T3ZKs1rMeReB5dzdYTwWAXRW7AikR82Q"
        "@dpg-d6idmvsr85hc73a0pcr0-a.oregon-postgres.render.com/naf_pft_sys"
        "?sslmode=require"
    )
    # WARNING: Remove or comment this block before pushing to Git / deploying!
    # Better: use python-dotenv + .env file for local dev

# ────────────────────────────────────────────────
engine = create_engine(
    DATABASE_URL,
    echo=False,                     # set True only for local debugging (logs queries)
    # Cloud-optimized pool settings (highly recommended for Render)
    pool_pre_ping=True,             # auto-detects & discards dead connections
    pool_recycle=3600,              # refreshes connections every ~1 hour
    # Optional tuning (uncomment if you have high traffic):
    # pool_size=5,
    # max_overflow=10,
    # pool_timeout=30,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()