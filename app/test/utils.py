
from sqlalchemy import create_engine, text
from sqlalchemy.orm import  sessionmaker
from sqlalchemy.pool import StaticPool
from app.models.services import Services
from app.models.bookings import Bookings
from app.database import Base, get_db
from main import app
from fastapi.testclient import TestClient
import pytest


SQL_ALCHEMY_DATABASE_URL = "sqlite:///./testdb.db"

engine = create_engine(
    SQL_ALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass = StaticPool
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture()
def test_service():
    services = Services(
        name="Coating",
        description='Covering your nails',
        price=400,
        duration_minutes=60,
    )

    db = TestingSessionLocal()
    db.add(services)
    db.commit()
    yield services
    with engine.connect() as connection:
        connection.execute(text("DELETE FROM services;"))
        connection.commit()