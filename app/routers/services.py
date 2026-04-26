from fastapi import APIRouter, Depends
from database import get_db
from models.service import Service
from schemas.service import ServiceRequest
from typing import Annotated
from sqlalchemy.orm import Session
from starlette import status



router = APIRouter()


db_dependency = Annotated[Session, Depends(get_db)]

@router.get("/services", status_code=status.HTTP_200_OK)
async def get_services(db: db_dependency):
    return db.query(Service).all()


@router.post('/service', status_code=status.HTTP_201_CREATED)
async def create_service(db: db_dependency, service_request: ServiceRequest):
    service_model = Service(**service_request.model_dump())
    db.add(service_model)
    db.commit()
    db.refresh(service_model)
    return service_model
