from sqlalchemy.orm import Session
from models.booking import Bookings
from schemas.booking import BookingRequest, BookingStatusUpdate


def get_all_bookings(db: Session):
    return db.query(Bookings).all()

def get_booking_by_id(db: Session, booking_id: int):
    return db.query(Bookings).filter(Bookings.id == booking_id).first()

def create_booking(booking_request: BookingRequest, db: Session):
    booking_model = Bookings(**booking_request.model_dump())
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

