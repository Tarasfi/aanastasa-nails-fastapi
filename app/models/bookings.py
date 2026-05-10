from app.database import Base
from sqlalchemy import Column, Integer, String, ForeignKey, Date, Time


class Bookings(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)

    client_name = Column(String, nullable=False)
    client_surname = Column(String)
    client_phone = Column(String)

    booking_date = Column(Date)
    booking_time = Column(Time)

    status = Column(String, default="pending")

    service_id = Column(Integer, ForeignKey("services.id"))
