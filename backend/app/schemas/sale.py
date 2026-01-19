from pydantic import BaseModel
from datetime import datetime

class SaleCreate(BaseModel):
    amount: float
    payment_method: str
    customer_id: int | None = None

class SaleOut(SaleCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
