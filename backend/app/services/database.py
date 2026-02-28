# # from sqlalchemy import create_engine
# # from sqlalchemy.orm import sessionmaker, declarative_base

# # DATABASE_URL = "mysql+pymysql://root:@localhost/naf_pft_db"
# # #use this below if you get password
# # #DATABASE_URL = "mysql+pymysql://davetra2_oladoyin:GrandpaSage2@localhost/davetra2_naf_pft_sys"


# # engine = create_engine(DATABASE_URL, echo=True)

# # SessionLocal = sessionmaker(
# #     autocommit=False,
# #     autoflush=False,
# #     bind=engine
# # )

# # Base = declarative_base()

# # def get_db():
# #     db = SessionLocal()
# #     try:
# #         yield db
# #     finally:
# #         db.close()

# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker, declarative_base
# import os

# # Use SQLite for Render Free (no external DB required)
# DATABASE_URL = "sqlite:///./naf_pft.db"

# # Create engine with SQLite-specific argument
# engine = create_engine(
#     DATABASE_URL,
#     connect_args={"check_same_thread": False},  # Required for SQLite + FastAPI
#     echo=True
# )

# # SessionLocal factory
# SessionLocal = sessionmaker(
#     autocommit=False,
#     autoflush=False,
#     bind=engine
# )

# # Base class for models
# Base = declarative_base()

# # Dependency for FastAPI
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()


from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

#DATABASE_URL = "mysql+pymysql://root:@localhost/naf_pft_db"
#use this below if you want to use online database
#DATABASE_URL = "mysql+pymysql://davetra2_oladoyin:GrandpaSage2@localhost/davetra2_naf_pft_sys"
#connecting to online database
DATABASE_URL = "mysql+pymysql://davetra2_oladoyin:GrandpaSage2@localhost/davetra2_naf_pft_sys"


engine = create_engine(DATABASE_URL, echo=True)

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