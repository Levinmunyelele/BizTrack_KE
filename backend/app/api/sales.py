from sqlalchemy import func
from fastapi import APIRouter, Depends, Query  
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
import csv
import io
from datetime import date, datetime, timedelta, timezone


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
    range: str = Query("7d", pattern="^(today|7d|30d)$"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    # 1. Timezone Setup (East Africa Time - UTC+3)
    # This ensures sales made at 1 AM Nairobi time count as "Today"
    now_eat = datetime.now(timezone(timedelta(hours=3)))
    today_start_eat = now_eat.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 2. Determine the SINGLE start date based on the user's selection
    if range == "today":
        filter_start_eat = today_start_eat
    elif range == "7d":
        filter_start_eat = today_start_eat - timedelta(days=6)
    else: # "30d"
        filter_start_eat = today_start_eat - timedelta(days=29)

    # Convert to UTC for the database query
    filter_start_utc = filter_start_eat.astimezone(timezone.utc)

    # 3. Calculate the ONE Total for the selected range
    # We use this same filter for everything below so the numbers match perfectly
    total_amount = (
        db.query(func.coalesce(func.sum(Sale.amount), 0))
        .filter(Sale.business_id == current_user.business_id)
        .filter(Sale.created_at >= filter_start_utc)
        .scalar()
    )

    # 4. Exclusive Display Logic
    # Only fill the box the user asked for; zero out the rest
    today_total = 0.0
    week_total = 0.0
    month_total = 0.0

    if range == "today":
        today_total = float(total_amount)
    elif range == "7d":
        week_total = float(total_amount)
    else:
        month_total = float(total_amount)

    # 5. Payment Breakdown
    payment_breakdown = (
        db.query(
            Sale.payment_method,
            func.count(Sale.id),
            func.coalesce(func.sum(Sale.amount), 0),
        )
        .filter(Sale.business_id == current_user.business_id)
        .filter(Sale.created_at >= filter_start_utc)
        .group_by(Sale.payment_method)
        .all()
    )

    payments = [
        {"method": pm, "count": int(cnt), "total": float(t)}
        for pm, cnt, t in payment_breakdown
    ]

    # 6. Top Customers
    top_customers_raw = (
        db.query(
            Customer.id,
            Customer.name,
            func.coalesce(func.sum(Sale.amount), 0).label("total_spent"),
            func.count(Sale.id).label("orders"),
        )
        .join(Customer, Sale.customer_id == Customer.id)
        .filter(Sale.business_id == current_user.business_id)
        .filter(Sale.created_at >= filter_start_utc)
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

    # 7. Best Day
    best_day_raw = (
        db.query(
            func.date(Sale.created_at).label("day"),
            func.coalesce(func.sum(Sale.amount), 0).label("total"),
        )
        .filter(Sale.business_id == current_user.business_id)
        .filter(Sale.created_at >= filter_start_utc)
        .group_by(func.date(Sale.created_at))
        .order_by(func.coalesce(func.sum(Sale.amount), 0).desc())
        .first()
    )

    best_day = None
    if best_day_raw:
        best_day = {"day": str(best_day_raw.day), "total": float(best_day_raw.total)}

    return {
        "range": range,
        "start_day": str(filter_start_eat.date()),
        "end_day": str(now_eat.date()),
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