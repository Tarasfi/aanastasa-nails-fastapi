from fastapi import APIRouter, Depends, Path, HTTPException
from app.crud import crud_service
from app.database import get_db
from app.schemas.service import ServiceRequest
from typing import Annotated
from sqlalchemy.orm import Session
from starlette import status



router = APIRouter()


db_dependency = Annotated[Session, Depends(get_db)]

@router.get("/services", status_code=status.HTTP_200_OK)
async def get_services(db: db_dependency):
    return crud_service.get_all_services(db)


@router.post('/services', status_code=status.HTTP_201_CREATED)
async def create_service(db: db_dependency, service_request: ServiceRequest):
    return crud_service.create_new_service(db, service_request)



############################# Should add is_active = False instead of that #############################
#Delete service
@router.delete("/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(db: db_dependency, service_id: int = Path(gt=0)):
    service_to_delete = crud_service.delete_service(db, service_id)
    if not service_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Service not found')

