import datetime as dt

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.models.services import Services
from app.models.bookings import Bookings

from main import app



#------------------------- DATABASE -------------------------


TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass = StaticPool
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

#Create Tables
Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db


#------------------------- FIXTURES -------------------------



@pytest.fixture()
def client():
    return TestClient(app)

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.rollback() #Revert changes if failure
        db.close()


@pytest.fixture
def test_service(db_session):
    service = Services(name="Coating", description='Covering your nails', price=400, duration_minutes=60)

    db_session.add(service)
    db_session.commit()
    db_session.refresh(service)


    return service



@pytest.fixture
def test_booking(db_session, test_service):

    booking = Bookings(client_name="Tarastest",
                       client_surname='firkotest',
                       client_phone="+380988761442",
                       booking_date=dt.date.fromisoformat('2026-06-02'),
                       booking_time=dt.time.fromisoformat('14:30:00'),
                       status="pending",
                       service_id=test_service.id)

    db_session.add(booking)
    db_session.commit()
    db_session.refresh(booking)


    return booking






