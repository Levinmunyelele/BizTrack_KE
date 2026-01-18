from pydantic import BaseModel
from datetime import datetime

class BusinessCreate(BaseModel):
    name: str
    location: str | None = None

class BusinessOut(BusinessCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
