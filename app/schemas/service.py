from pydantic import BaseModel, Field
from enum import Enum

class ServiceCategoryEnum(str, Enum):
    MANICURE="manicure"
    PEDICURE="pedicure"


class ServiceRequest(BaseModel):
    name: str = Field(min_length=2)
    description: str | None = None
    price: int = Field(gt=0)
    duration_minutes: int = Field(gt=0)
    category: ServiceCategoryEnum

#Example
# {
#   "name": "Coating",
#   "description": "Coating description",
#   "price": 400,
#   "duration_minutes": 90
#   "category": "manicure"

# }