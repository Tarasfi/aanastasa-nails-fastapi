from fastapi import APIRouter, Depends
from database import engine, SessionLocal
from models.booking import Bookings
from schemas.booking import BookingRequest
from typing import Annotated
from sqlalchemy.orm import Session


router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]

@router.get("/bookings")
async def get_bookings():
    return {"bookings": "data"}


@router.post('/booking')
async def create_booking(db: db_dependency, booking_request: BookingRequest):
    booking_model = Bookings(**booking_request.model_dump())
    db.add(booking_model)
    db.commit()