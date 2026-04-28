from fastapi import APIRouter, Depends, HTTPException, Path
from starlette import status
from database import get_db
from models.booking import Bookings
from models.services import Services
from schemas.booking import BookingRequest, BookingStatusUpdate
from typing import Annotated
from sqlalchemy.orm import Session


router = APIRouter()


db_dependency = Annotated[Session, Depends(get_db)]

@router.get("/bookings", status_code=status.HTTP_200_OK)
async def get_bookings(db: db_dependency):
    return db.query(Bookings).all()


@router.post("/bookings", status_code=status.HTTP_201_CREATED)
async def create_booking(db: db_dependency, booking_request: BookingRequest):
    booking_model = Bookings(**booking_request.model_dump())

    #Preventing the booking of non-existing service
    service_existence = db.query(Services).filter(Services.id == booking_model.service_id).first()
    if service_existence is None:
        raise HTTPException(status_code=404, detail="Service not found")

    #Preventing bookings in the past
    if booking_request.is_in_past():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking time cannot be in the past"
        )

    db.add(booking_model)
    db.commit()
    db.refresh(booking_model)
    return booking_model


#Update booking status: pending -> confirmed
@router.patch("/bookings/{booking_id}/status")
async def update_booking_status(db: db_dependency, booking_status_update: BookingStatusUpdate, booking_id: int = Path(gt=0)):
    booking_model = db.query(Bookings).filter(Bookings.id == booking_id).first()
    if booking_model is None:
        raise HTTPException(status_code=404, detail='Booking not found')
    booking_model.status = booking_status_update.status

    db.commit()
    db.refresh(booking_model)
    return booking_model
