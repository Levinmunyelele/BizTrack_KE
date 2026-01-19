from sqlalchemy import func
from datetime import date
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

@router.get("/summary")
def sales_summary(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Total sales today
    today_total = (
        db.query(func.coalesce(func.sum(Sale.amount), 0))
        .filter(Sale.business_id == current_user.business_id)
        .filter(func.date(Sale.created_at) == date.today())
        .scalar()
    )

    # Total sales this month
    month_total = (
        db.query(func.coalesce(func.sum(Sale.amount), 0))
        .filter(Sale.business_id == current_user.business_id)
        .filter(func.date_trunc("month", Sale.created_at) == func.date_trunc("month", func.now()))
        .scalar()
    )

    # Payment method breakdown
    payment_breakdown = (
        db.query(Sale.payment_method, func.count(Sale.id), func.coalesce(func.sum(Sale.amount), 0))
        .filter(Sale.business_id == current_user.business_id)
        .group_by(Sale.payment_method)
        .all()
    )

    payments = [
        {"method": pm, "count": cnt, "total": total}
        for pm, cnt, total in payment_breakdown
    ]

    return {
        "today_total": float(today_total),
        "month_total": float(month_total),
        "payments": payments
    }
