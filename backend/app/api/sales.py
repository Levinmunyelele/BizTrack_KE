from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.deps import get_db
from app.core.dependencies import get_current_user
from app.models.sale import Sale
from app.schemas.sale import SaleCreate, SaleOut

router = APIRouter(prefix="/sales", tags=["Sales"])

@router.post("", response_model=SaleOut)
def create_sale(
    data: SaleCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    sale = Sale(
        **data.dict(),
        business_id=current_user.business_id,
        created_by=current_user.id
    )
    db.add(sale)
    db.commit()
    db.refresh(sale)
    return sale

@router.get("", response_model=list[SaleOut])
def list_sales(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return (
        db.query(Sale)
        .filter(Sale.business_id == current_user.business_id)
        .all()
    )
