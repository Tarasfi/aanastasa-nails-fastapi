import os
from dotenv import load_dotenv
load_dotenv()
import sqlalchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.security import get_password_hash



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


#Create default admin if not exists
def init_admin():
    from app.models.admin import Admin
    db = SessionLocal()
    try:
        admin_exists = db.query(Admin).first()
        if not admin_exists:
            hashed_password = get_password_hash("admin123")

            default_admin = Admin(username="admin", hashed_password=hashed_password)

            db.add(default_admin)
            db.commit()
            print("Default admin created. Login: admin | Password: admin123")
        else:
            print("Admin already exists, admin creating skipped")
    except Exception as e:
        print(f"Error at admin initialisation: {e}")
        db.rollback()
    finally:
        db.close()

