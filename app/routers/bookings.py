from fastapi import APIRouter, Depends, HTTPException, Path
from starlette import status
from app.database import get_db
from app.schemas.booking import BookingRequest, BookingStatusUpdate
from sqlalchemy.orm import Session
from app.crud import crud_booking
from app.crud import crud_service
from typing import Annotated


router = APIRouter()

db_dependency = Annotated[Session, Depends(get_db)]

@router.get("/bookings", status_code=status.HTTP_200_OK)
async def get_all_bookings(db: db_dependency):
    return crud_booking.get_all_bookings(db)


@router.post("/bookings", status_code=status.HTTP_201_CREATED)
async def create_booking(booking_request: BookingRequest, db: db_dependency):
    #Preventing bookings in the past
    if booking_request.is_in_past():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking time cannot be in the past"
        )

    #Preventing the booking of non-existing service
    service_existence = crud_service.get_service_by_id(db, booking_request.service_id)
    if service_existence is None:
        raise HTTPException(status_code=404, detail="Service not found")

    return crud_booking.create_booking(booking_request, db)


#Update booking status: pending -> confirmed
@router.patch("/bookings/{booking_id}/status")
async def update_booking_status(booking_status_update: BookingStatusUpdate, db: db_dependency, booking_id: int = Path(gt=0)):
    updated_booking = crud_booking.update_booking_status(booking_status_update, db, booking_id)
    if updated_booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Booking not found')

    return updated_booking


############################# Should add is_active = False instead of that #############################
#Delete booking
@router.delete("/bookings/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_booking(db: db_dependency, booking_id: int = Path(gt=0)):
    booking_to_delete = crud_booking.delete_booking(db, booking_id)
    if not booking_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Booking not found')



# @router.delete("/bookings/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
# async def delete_booking(db: db_dependency, booking_id: int = Path(gt=0)):
#     booking_to_delete = db.query(Bookings).filter(Bookings.id == booking_id).first()
#     if booking_to_delete is None:
#     raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Booking not found')
#
#     db.delete(booking_to_delete)
#
#     db.commit()