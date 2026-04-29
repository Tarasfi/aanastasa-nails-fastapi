from sqlalchemy.orm import Session
from models.services import Services
from schemas.service import ServiceRequest


def get_all_services(db: Session):
    all_services = db.query(Services).all()
    return all_services

def get_service_by_id(db: Session, service_id: int):
    current_service = db.query(Services).filter(Services.id == service_id).first()
    return current_service

def create_new_service(db: Session, service_request: ServiceRequest):
    service_model = Services(**service_request.model_dump())
    db.add(service_model)
    db.commit()
    db.refresh(service_model)
    return service_model

def delete_service(db: Session, service_id: int):
    service_to_delete = get_service_by_id(db, service_id)
    if service_to_delete:
        db.delete(service_to_delete)
        db.commit()
        return True
    return False