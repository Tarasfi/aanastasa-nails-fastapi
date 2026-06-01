from datetime import timedelta

from sqlalchemy.orm import Session
from app.models.bookings import Bookings
from app.models.services import Services
from app.schemas.booking import BookingRequest, BookingStatusUpdate
from datetime import datetime, time, timedelta
from fastapi import HTTPException


def get_all_bookings(db: Session):
    return db.query(Bookings).all()


def get_booking_by_id(db: Session, booking_id: int):
    return db.query(Bookings).filter(Bookings.id == booking_id).first()













def validate_working_hours(booking_date, booking_time):
    day_of_week = booking_date.weekday()

    if day_of_week == 6:
        raise HTTPException(status_code=400, detail="We are closed on Sunday.")
    if day_of_week == 5:
        if not (time(10, 0) <= booking_time <= time(16, 0)):
            raise HTTPException(status_code=400, detail="On Saturday we work from 10:00 to 16:00")
    else:
        if not (time(9, 0) <= booking_time <= time(21, 0)):
            raise HTTPException(status_code=400, detail="On weekdays we work from 09:00 to 21:00")

def check_time_collision(db, booking_date, start_time, end_time):
    collision = db.query(Bookings).filter(
        Bookings.booking_date == booking_date,
        start_time < Bookings.booking_end,
        end_time > Bookings.booking_time
    ).first()
    if collision:
        raise HTTPException(status_code=400, detail="Time is occupied.")


def create_booking(booking_request: BookingRequest, db: Session):
    validate_working_hours(booking_request.booking_date, booking_request.booking_time)
    duration = db.query(Services.duration_minutes).filter(Services.id == booking_request.service_id).scalar()

    start_dt = datetime.combine(booking_request.booking_date, booking_request.booking_time)
    end_dt = start_dt + timedelta(minutes=duration)
    booking_end_time = end_dt.time()

    check_time_collision(db, booking_request.booking_date, booking_request.booking_time, booking_end_time)


    new_booking = Bookings(**booking_request.model_dump(), booking_end=booking_end_time)


    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking

















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
