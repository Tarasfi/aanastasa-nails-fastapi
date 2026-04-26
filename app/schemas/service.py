from pydantic import BaseModel, Field

class ServiceRequest(BaseModel):
    name: str = Field(min_length=2)
    description: str | None = None
    price: int = Field(gt=0)
    duration_minutes: int = Field(gt=0)

#Example
# {
#   "name": "Coating",
#   "description": "Coating description",
#   "price": 400,
#   "duration_minutes": 90
# }