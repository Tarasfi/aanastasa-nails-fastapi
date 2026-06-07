from fastapi import FastAPI
from app.routers import services, bookings, auth
from app.database import *
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware


# Create test admin if not exists
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

origins = [
    "http://localhost",
    "http://127.0.0.1",
    "http://localhost:5500"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(bookings.router)
app.include_router(services.router)
