from datetime import date, time
from pydantic import BaseModel, Field

class BookingRequest(BaseModel):
    client_name: str = Field(min_length=2)
    client_surname: str = Field(min_length=2)
    client_phone: str
    booking_date: date
    booking_time: time
    status: str = "pending"
    service_id: int

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
