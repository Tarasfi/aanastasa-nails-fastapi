from fastapi import APIRouter, Depends
from database import get_db
from models.booking import Bookings
from schemas.booking import BookingRequest
from typing import Annotated
from sqlalchemy.orm import Session


router = APIRouter()


db_dependency = Annotated[Session, Depends(get_db)]

@router.get("/bookings")
async def get_bookings(db: db_dependency):
    return db.query(Bookings).all()


@router.post('/bookings')
async def create_booking(db: db_dependency, booking_request: BookingRequest):
    booking_model = Bookings(**booking_request.model_dump())
    db.add(booking_model)
    db.commit()
    db.refresh(booking_model)
    return booking_model