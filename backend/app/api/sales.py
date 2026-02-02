from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
import csv
import io

from app.db.deps import get_db
from app.core.dependencies import get_current_user
from app.models.sale import Sale
from app.schemas.sale import SaleCreate, SaleOut
from app.models.customer import Customer

router = APIRouter(prefix="/sales", tags=["Sales"])

# --- TIMEZONE HELPER (Kenya/EAT is UTC+3) ---
def get_date_range_filters(range_str: str):
    """
    Returns the UTC start datetime for the given range, 
    calculated based on East Africa Time (EAT).
    """
    # Current time in Nairobi
    now_eat = datetime.now(timezone(timedelta(hours=3)))
    
    # "Today" in Nairobi starts at 00:00:00
    today_start_eat = now_eat.replace(hour=0, minute=0, second=0, microsecond=0)

    if range_str == "today":
        start_eat = today_start_eat
    elif range_str == "7d":
        start_eat = today_start_eat - timedelta(days=6)
    elif range_str == "30d":
        start_eat = today_start_eat - timedelta(days=29)
    else:
        # Fallback to 7d if something weird happens
        start_eat = today_start_eat - timedelta(days=6)

    # Convert EAT start time to UTC (because Database stores UTC)
    start_utc = start_eat.astimezone(timezone.utc)
    
    return start_utc, now_eat

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
        .order_by(Sale.created_at.desc())
        .all()
    )

@router.get("/summary")
def sales_summary(
    range: str = Query("7d", pattern="^(today|7d|30d)$"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    # 1. Get the correct start time (UTC)
    start_utc, now_eat = get_date_range_filters(range)

    # 2. Get Payment Breakdown FIRST
    # We will use this to calculate the total, ensuring they match perfectly.
    payment_stats = (
        db.query(
            Sale.payment_method,
            func.count(Sale.id),
            func.coalesce(func.sum(Sale.amount), 0),
        )
        .filter(Sale.business_id == current_user.business_id)
        .filter(Sale.created_at >= start_utc)
        .group_by(Sale.payment_method)
        .all()
    )

    # 3. Build the Payment List AND Calculate Total Sum simultaneously
    payments_list = []
    calculated_total = 0.0

    for method, count, amount in payment_stats:
        amt = float(amount)
        # Handle "None" payment methods so they don't disappear
        method_name = method if method else "Unknown/Other"
        
        payments_list.append({
            "method": method_name, 
            "count": int(count), 
            "total": amt
        })
        calculated_total += amt

    # 4. Set the exclusive totals based on user selection
    # (Shows 0 for the unselected ranges, as requested)
    today_total = 0.0
    week_total = 0.0
    month_total = 0.0

    if range == "today":
        today_total = calculated_total
    elif range == "7d":
        week_total = calculated_total
    else:
        month_total = calculated_total

    # 5. Get Top Customers (Using same date filter)
    top_customers_raw = (
        db.query(
            Customer.id,
            Customer.name,
            func.coalesce(func.sum(Sale.amount), 0).label("total_spent"),
            func.count(Sale.id).label("orders"),
        )
        .join(Customer, Sale.customer_id == Customer.id)
        .filter(Sale.business_id == current_user.business_id)
        .filter(Sale.created_at >= start_utc)
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

    # 6. Best Day Logic
    best_day_raw = (
        db.query(
            func.date(Sale.created_at).label("day"),
            func.coalesce(func.sum(Sale.amount), 0).label("total"),
        )
        .filter(Sale.business_id == current_user.business_id)
        .filter(Sale.created_at >= start_utc)
        .group_by(func.date(Sale.created_at))
        .order_by(func.coalesce(func.sum(Sale.amount), 0).desc())
        .first()
    )

    best_day = None
    if best_day_raw:
        best_day = {"day": str(best_day_raw.day), "total": float(best_day_raw.total)}

    return {
        "range": range,
        "start_day": str(start_utc.date()), 
        "end_day": str(now_eat.date()),
        "today_total": today_total,
        "week_total": week_total,
        "month_total": month_total,
        "payments": payments_list,
        "top_customers": top_customers,
        "best_day": best_day,
    }

@router.get("/export")
def export_sales_csv(
    range: str = Query("7d", pattern="^(today|7d|30d)$"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    # Use exact same date logic as summary
    start_utc, _ = get_date_range_filters(range)

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
        .filter(Sale.created_at >= start_utc)
        .order_by(Sale.created_at.desc())
    )

    rows = q.all()

    def generate():
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(["id", "amount", "payment_method", "customer_id", "customer_name", "created_at_utc"])
        for r in rows:
            writer.writerow([r.id, r.amount, r.payment_method, r.customer_id, r.customer_name, r.created_at])
        yield buf.getvalue()

    filename = f"sales_{range}.csv"
    return StreamingResponse(
        generate(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )