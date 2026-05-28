from fastapi import FastAPI
from app.routers import services, bookings
from app.database import *
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    init_admin()

    yield


app = FastAPI(
    title="Aanastasa Nails Booking System Swagger",
    description="Booking System Swagger for Aanastasa Nails by Tarasfi",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(bookings.router)
app.include_router(services.router)