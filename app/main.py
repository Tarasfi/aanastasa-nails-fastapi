from fastapi import FastAPI
from routers import services, bookings

app = FastAPI()

app.include_router(bookings.router)
app.include_router(services.router)