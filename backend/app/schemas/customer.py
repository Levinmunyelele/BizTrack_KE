from pydantic import BaseModel
from datetime import datetime

class CustomerCreate(BaseModel):
    name: str
    phone: str | None = None
    email: str | None = None

class CustomerOut(CustomerCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
