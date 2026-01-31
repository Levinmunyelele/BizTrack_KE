from sqlalchemy import func
from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.deps import get_db
from app.core.dependencies import get_current_user
from app.models.sale import Sale
from app.schemas.sale import SaleCreate, SaleOut
from app.models.customer import Customer
from datetime import date, timedelta
from fastapi.responses import StreamingResponse
import csv, io
from datetime import datetime, timedelta, timezone

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
    range: str = Query("7d", pattern="^(today|7d|30d)$"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    # Decide the date window (inclusive)
    end_day = date.today()

    if range == "today":
        start_day = end_day
    elif range == "7d":
        start_day = end_day - timedelta(days=6)   # last 7 days including today
    else:  # "30d"
        start_day = end_day - timedelta(days=29)  # last 30 days including today

    base = (
        db.query(Sale)
        .filter(Sale.business_id == current_user.business_id)
        .filter(func.date(Sale.created_at) >= start_day)
        .filter(func.date(Sale.created_at) <= end_day)
    )

    # Totals in the selected range
    total = db.query(func.coalesce(func.sum(Sale.amount), 0)).select_from(base.subquery()).scalar()

    # If you still want these keys in frontend, map them by range:
    today_total = 0.0
    week_total = 0.0
    month_total = 0.0

    if range == "today":
        today_total = float(total)
    elif range == "7d":
        week_total = float(total)
    else:
        month_total = float(total)

    # Payment method breakdown (in range)
    payment_breakdown = (
        db.query(
            Sale.payment_method,
            func.count(Sale.id),
            func.coalesce(func.sum(Sale.amount), 0),
        )
        .filter(Sale.business_id == current_user.business_id)
        .filter(func.date(Sale.created_at) >= start_day)
        .filter(func.date(Sale.created_at) <= end_day)
        .group_by(Sale.payment_method)
        .all()
    )

    payments = [
        {"method": pm, "count": int(cnt), "total": float(total)}
        for pm, cnt, total in payment_breakdown
    ]

    # Top customers (in range)
    top_customers_raw = (
        db.query(
            Customer.id,
            Customer.name,
            func.coalesce(func.sum(Sale.amount), 0).label("total_spent"),
            func.count(Sale.id).label("orders"),
        )
        .join(Customer, Sale.customer_id == Customer.id)
        .filter(Sale.business_id == current_user.business_id)
        .filter(func.date(Sale.created_at) >= start_day)
        .filter(func.date(Sale.created_at) <= end_day)
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

    # Best day (in range)
    best_day_raw = (
        db.query(
            func.date(Sale.created_at).label("day"),
            func.coalesce(func.sum(Sale.amount), 0).label("total"),
        )
        .filter(Sale.business_id == current_user.business_id)
        .filter(func.date(Sale.created_at) >= start_day)
        .filter(func.date(Sale.created_at) <= end_day)
        .group_by(func.date(Sale.created_at))
        .order_by(func.coalesce(func.sum(Sale.amount), 0).desc())
        .first()
    )

    best_day = None
    if best_day_raw:
        best_day = {"day": str(best_day_raw.day), "total": float(best_day_raw.total)}

    return {
        "range": range,
        "start_day": str(start_day),
        "end_day": str(end_day),
        "today_total": today_total,
        "week_total": week_total,
        "month_total": month_total,
        "payments": payments,
        "top_customers": top_customers,
        "best_day": best_day,
    }

def _range_start(range: str):
    now = datetime.now(timezone.utc)
    if range == "today":
        return now.replace(hour=0, minute=0, second=0, microsecond=0)
    if range == "7d":
        return now - timedelta(days=7)
    if range == "30d":
        return now - timedelta(days=30)
    return None  # no filter
@router.get("/export")
def export_sales_csv(
    range: str = Query("7d", pattern="^(today|7d|30d)$"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    start = _range_start(range)

    q = (
        db.query(
            Sale.id,
            Sale.amount,
            Sale.payment_method,
            Sale.customer_id,
            Sale.created_at,
            Customer.name.label("customer_name"),
        )
        .outerjoin(Customer, Sale.customer_id == Customer.id)
        .filter(Sale.business_id == current_user.business_id)
        .order_by(Sale.created_at.desc())
    )
    if start is not None:
        q = q.filter(Sale.created_at >= start)

    rows = q.all()

    def generate():
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(["id", "amount", "payment_method", "customer_id", "customer_name", "created_at"])
        for r in rows:
            writer.writerow([r.id, r.amount, r.payment_method, r.customer_id, r.customer_name, r.created_at])
        yield buf.getvalue()

    filename = f"sales_{range}.csv"
    return StreamingResponse(
        generate(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
