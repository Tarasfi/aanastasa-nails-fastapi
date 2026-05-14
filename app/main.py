from fastapi import FastAPI
from app.routers import services, bookings
from app.database import *

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(bookings.router)
app.include_router(services.router)