from app.database import Base
from sqlalchemy import Column, Integer, String, ForeignKey, Date, Time, Table
from sqlalchemy.orm import relationship
#Many-to-many table
booking_services = Table(
    "booking_services",
    Base.metadata,
    Column("booking_id", Integer, ForeignKey("bookings.id", ondelete="CASCADE"), primary_key=True),
    Column("service_id", Integer, ForeignKey("services.id", ondelete="CASCADE"), primary_key=True),
)

class Bookings(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)

    client_name = Column(String, nullable=False)
    client_phone = Column(String, nullable=False)

    booking_date = Column(Date, nullable=False)
    booking_time = Column(Time, nullable=False)
    booking_end = Column(Time, nullable=True)

    status = Column(String, default="pending")

    services = relationship("Services", secondary=booking_services, backref="bookings")
