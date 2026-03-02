# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker, declarative_base

# #sorry, try this jare:


# # DATABASE_URL = "mysql+pymysql://davetra2_oladoyin:GrandpaSage2@davetracktechnologies.com:3306/davetra2_naf_pft_sys"
# # #use this below if you get password
# # #DATABASE_URL = "mysql+pymysql://davetra2_oladoyin:GrandpaSage2@localhost/davetra2_naf_pft_sys"


# engine = create_engine(DATABASE_URL, echo=True)

# SessionLocal = sessionmaker(
#     autocommit=False,
#     autoflush=False,
#     bind=engine
# )

# Base = declarative_base()

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()


# database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Best practice: read from Render environment variable
DATABASE_URL = os.getenv("DATABASE_URL")

# Only for local testing / fallback (never commit real credentials!)
if not DATABASE_URL:
    DATABASE_URL = (
        "postgresql://naf_pft_sys_user:T3ZKs1rMeReB5dzdYTwWAXRW7AikR82Q"
        "@dpg-d6idmvsr85hc73a0pcr0-a/naf_pft_sys"
        "?sslmode=require"   # ← added for safety
    )
    # Warning: remove or comment this block before pushing to production!

# Create engine
engine = create_engine(
    DATABASE_URL,
    echo=False,          # ← change to True only when debugging queries
    # Optional: pool settings for better performance under load
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