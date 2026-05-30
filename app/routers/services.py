from fastapi import APIRouter, Depends, Path, HTTPException
from app.crud import crud_service
from app.database import get_db
from app.schemas.service import ServiceRequest
from typing import Annotated
from sqlalchemy.orm import Session
from starlette import status
from app.models.admin import Admin
from app.routers.deps import get_current_admin



router = APIRouter(
    tags=["Services"]
)


db_dependency = Annotated[Session, Depends(get_db)]

@router.get("/services", status_code=status.HTTP_200_OK)
async def get_services(db: db_dependency):

    return crud_service.get_all_services(db)

@router.get('/services/{service_id}', status_code=status.HTTP_200_OK)
def get_service_by_id(db: db_dependency, service_id: int):
    if not crud_service.get_service_by_id(db, service_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Service not found')
    return crud_service.get_service_by_id(db, service_id)


@router.post('/services', status_code=status.HTTP_201_CREATED)
async def create_service(db: db_dependency, service_request: ServiceRequest, current_admin: Admin = Depends(get_current_admin)):
    return crud_service.create_new_service(db, service_request)


############################# Should add is_active = False instead of that #############################
#Delete service
@router.delete("/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(db: db_dependency, service_id: int = Path(gt=0), current_admin: Admin = Depends(get_current_admin)):
    service_to_delete = crud_service.delete_service(db, service_id)
    if not service_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Service not found')


