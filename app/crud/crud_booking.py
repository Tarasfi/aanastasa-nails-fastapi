from sqlalchemy.orm import Session
from app.models.bookings import Bookings
from app.models.services import Services
from app.schemas.booking import BookingRequest, BookingStatusUpdate
import datetime


def get_all_bookings(db: Session):
    return db.query(Bookings).all()

def get_booking_by_id(db: Session, booking_id: int):
    return db.query(Bookings).filter(Bookings.id == booking_id).first()

def create_booking(booking_request: BookingRequest, db: Session):
    service_duration_in_minutes = db.query(Services.duration_minutes).filter(Services.id == booking_request.service_id).scalar() #Look for duration of the service that user picked
    booking_datetime = datetime.datetime.combine(booking_request.booking_date, booking_request.booking_time).replace(tzinfo=None) #Returns a datetime ex.:"2026-08-16T13:00:00"
    session_end_datetime = booking_datetime + datetime.timedelta(minutes=service_duration_in_minutes) #Returns a datetime + duration of servic ex.:"2026-08-16T14:30:00"
    booking_end_time = session_end_datetime.time() #Raw end_time "14:30:00"

    booking_model = Bookings(**booking_request.model_dump(), booking_end=booking_end_time)

    db.add(booking_model)
    db.commit()
    db.refresh(booking_model)
    return booking_model


def update_booking_status(status_update: BookingStatusUpdate, db: Session, booking_id: int):
    booking = get_booking_by_id(db, booking_id)
    if booking:
        booking.status = status_update.status
        db.commit()
        db.refresh(booking)
    return booking

def delete_booking(db: Session, booking_id: int):
    booking_to_delete = get_booking_by_id(db, booking_id)
    if booking_to_delete:
        db.delete(booking_to_delete)
        db.commit()
        return True
    return False

