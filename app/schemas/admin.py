from pydantic import BaseModel, Field


class AdminRequest(BaseModel):
    username: str = Field(min_length=2)
    hashed_password: str = Field(min_length=2)
