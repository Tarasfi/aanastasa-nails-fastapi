from fastapi import APIRouter, Depends
from database import get_db
from models.services import Services
from schemas.service import ServiceRequest
from typing import Annotated
from sqlalchemy.orm import Session
from starlette import status



router = APIRouter()


db_dependency = Annotated[Session, Depends(get_db)]

@router.get("/services", status_code=status.HTTP_200_OK)
async def get_services(db: db_dependency):
    return db.query(Services).all()


@router.post('/services', status_code=status.HTTP_201_CREATED)
async def create_service(db: db_dependency, service_request: ServiceRequest):
    service_model = Services(**service_request.model_dump())
    db.add(service_model)
    db.commit()
    db.refresh(service_model)
    return service_model


#Delete service
@router.delete("/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(db: db_dependency, service_id: int):
    service_to_delete = db.query(Services).filter(Services.id == service_id).first()
    if service_to_delete is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Service not found')

    db.delete(service_to_delete)
    db.commit()
