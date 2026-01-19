from sqlalchemy import func
from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.deps import get_db
from app.core.dependencies import get_current_user
from app.models.sale import Sale
from app.schemas.sale import SaleCreate, SaleOut
from app.models.customer import Customer


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

    # Total sales this week
    week_total = (
    db.query(func.coalesce(func.sum(Sale.amount), 0))
    .filter(Sale.business_id == current_user.business_id)
    .filter(func.date(Sale.created_at) >= func.current_date() - 7)
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
    top_customers_raw = (
    db.query(
        Customer.id,
        Customer.name,
        func.coalesce(func.sum(Sale.amount), 0).label("total_spent"),
        func.count(Sale.id).label("orders")
    )
    .join(Customer, Sale.customer_id == Customer.id)
    .filter(Sale.business_id == current_user.business_id)
    .group_by(Customer.id, Customer.name)
    .order_by(func.coalesce(func.sum(Sale.amount), 0).desc())
    .limit(5)
    .all()
)

    top_customers = [
        {
            "customer_id": cid,
            "name": name,
            "total_spent": float(total_spent),
            "orders": int(orders),
        }
        for cid, name, total_spent, orders in top_customers_raw
    ]

    best_day_raw = (
    db.query(
        func.date(Sale.created_at).label("day"),
        func.coalesce(func.sum(Sale.amount), 0).label("total")
    )
    .filter(Sale.business_id == current_user.business_id)
    .group_by(func.date(Sale.created_at))
    .order_by(func.coalesce(func.sum(Sale.amount), 0).desc())
    .first()
)

    best_day = None
    if best_day_raw:
        best_day = {
            "day": str(best_day_raw.day),
            "total": float(best_day_raw.total)
        }



    return {
        "today_total": float(today_total),
        "week_total": float(week_total),
        "month_total": float(month_total),
        "payments": payments,
        "top_customers": top_customers,
        "best_day": best_day
    }

