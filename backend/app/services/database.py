from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "mysql+pymysql://root:@localhost/naf_pft_db"
#use this below if you get password
#DATABASE_URL = "mysql+pymysql://davetra2_oladoyin:GrandpaSage2@localhost/davetra2_naf_pft_sys"


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