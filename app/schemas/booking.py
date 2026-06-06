from datetime import date, time
from pydantic import BaseModel, Field
from enum import Enum
import datetime


class OrderStatusEnum(str, Enum):
    PENDING="pending"
    CONFIRMED="confirmed"
    CANCELLED="cancelled"


class BookingRequest(BaseModel):
    client_name: str = Field(min_length=2)
    client_surname: str = Field(min_length=2)
    client_phone: str
    booking_date: date
    booking_time: time
    service_id: int


    # Preventing bookings in the past
    def is_in_past(self):
        booking_datetime = datetime.datetime.combine(self.booking_date, self.booking_time).replace(tzinfo=None)
        current_time = datetime.datetime.now()
        return booking_datetime < current_time


class BookingStatusUpdate(BaseModel):
    status: OrderStatusEnum


class AvailableSlotResponse(BaseModel):
    time: str
    occupied: bool



# Example
# {
#   "client_name": "Taras",
#   "client_surname": "Firko",
#   "client_phone": "380988761442",
#   "booking_date": "2026-04-30",
#   "booking_time": "16:00:19.793Z",
#   "status": "pending",
#   "service_id": 1
# }
