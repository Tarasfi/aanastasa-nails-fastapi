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
