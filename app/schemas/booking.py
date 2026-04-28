from datetime import date, time
from pydantic import BaseModel, Field
import datetime

class BookingRequest(BaseModel):
    client_name: str = Field(min_length=2)
    client_surname: str = Field(min_length=2)
    client_phone: str
    booking_date: date
    booking_time: time
    status: str = "pending"
    service_id: int

    # Preventing bookings in the past
    def is_in_past(self):
        booking_datetime = datetime.datetime.combine(self.booking_date, self.booking_time).replace(tzinfo=None)
        current_time = datetime.datetime.now()
        print(current_time)
        print(booking_datetime)
        return booking_datetime < current_time


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
