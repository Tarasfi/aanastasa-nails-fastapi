from fastapi import APIRouter

router = APIRouter()

@router.get("/bookings")
async def get_bookings():
    return {"bookings": "data"}

