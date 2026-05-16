import os
from dotenv import load_dotenv
load_dotenv()
import sqlalchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker



#My local DB
# POSTGRESQL_DATABASE_URL = 'postgresql://postgres:taras@localhost/AanastasaNailsDatabase'

#Docker DB
POSTGRESQL_DATABASE_URL = os.getenv("POSTGRESQL_DATABASE_URL")

if POSTGRESQL_DATABASE_URL is None:
    raise ValueError("DB URL not found.")

engine = create_engine(POSTGRESQL_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = sqlalchemy.orm.declarative_base()
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

