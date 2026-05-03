from app.database import Base
from sqlalchemy import Column, Integer, String


class Services(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    price = Column(Integer)
    duration_minutes = Column(Integer)

