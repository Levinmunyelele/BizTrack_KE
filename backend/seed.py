import os
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.security import hash_password
from app.models.user import User
from app.models.business import Business
from app.models.customer import Customer
from app.models.sale import Sale


def _db_url() -> str:
    """
    Uses DATABASE_URL if set.
    Converts Render-style postgres:// to postgresql:// for SQLAlchemy.
    """
    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        url = "postgresql://postgres:postgres@localhost:5432/biztrack"
    return url.replace("postgres://", "postgresql://", 1)


def _now():
    return datetime.now(timezone.utc)


def _detect_sale_fields():
    amount_field = "amount" if hasattr(Sale, "amount") else ("total" if hasattr(Sale, "total") else None)
    if not amount_field:
        raise RuntimeError("Sale model missing amount/total field. Check app.models.sale.Sale columns.")

    method_field_candidates = ["method", "payment_method", "payment_type", "pay_method", "channel"]
    method_field = next((f for f in method_field_candidates if hasattr(Sale, f)), None)
    if not method_field:
        raise RuntimeError(
            "Sale model missing payment method field. "
            "Add one of: method/payment_method/payment_type/pay_method/channel, "
            "or update seed.py to match your Sale model."
        )

    return amount_field, method_field


def main():
    if os.getenv("RUN_SEED") != "1":
        print("RUN_SEED is not '1' — skipping seeding.")
        return

    database_url = _db_url()
    print(f"Seeding database: {database_url.split('@')[-1]}")

    engine = create_engine(database_url, pool_pre_ping=True)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    owner_email = os.getenv("SEED_OWNER_EMAIL", "levin@test.com").strip().lower()
    owner_password = os.getenv("SEED_OWNER_PASSWORD", "password123").strip()
    owner_name = os.getenv("SEED_OWNER_NAME", "Levin").strip()
    business_name = os.getenv("SEED_BUSINESS_NAME", "BizTrack KE").strip()

    customers_seed = [
        {"name": "John Doe", "phone": "+254700000001"},
        {"name": "Mary Wanjiku", "phone": "+254700000002"},
        {"name": "Brian Otieno", "phone": "+254700000003"},
    ]

    sales_seed = [
        {"customer": "John Doe", "amount": Decimal("1500"), "method": "mpesa"},
        {"customer": "Mary Wanjiku", "amount": Decimal("800"), "method": "cash"},
        {"customer": "John Doe", "amount": Decimal("2200"), "method": "mpesa"},
    ]

    amount_field, method_field = _detect_sale_fields()
    has_sale_created_at = hasattr(Sale, "created_at")

    with SessionLocal() as db:
        # ----------------------------
        # 1) Ensure owner exists
        # ----------------------------
        owner = db.query(User).filter(User.email == owner_email).first()

        # ----------------------------
        # 2) Resolve business to seed into
        #    - If owner exists: seed into owner's business_id
        #    - Else: create/find business by name then create owner
        # ----------------------------
        if owner:
            business = db.query(Business).filter(Business.id == owner.business_id).first()
            if not business:
                raise RuntimeError(f"Owner exists but business_id={owner.business_id} not found.")
            print(f"↩️ Owner exists: {owner.email} (id={owner.id}, business_id={owner.business_id})")
            print(f"✅ Seeding into owner's business: {business.name} (id={business.id})")
        else:
            business = db.query(Business).filter(Business.name == business_name).first()
            if not business:
                business = Business(name=business_name)
                if hasattr(Business, "created_at"):
                    business.created_at = _now()
                db.add(business)
                db.commit()
                db.refresh(business)
                print(f"✅ Created business: {business.name} (id={business.id})")
            else:
                print(f"↩️ Business exists: {business.name} (id={business.id})")

            owner = User(
                name=owner_name,
                email=owner_email,
                password_hash=hash_password(owner_password),
                role="owner",
                business_id=business.id,
            )
            if hasattr(User, "created_at"):
                owner.created_at = _now()
            db.add(owner)
            db.commit()
            db.refresh(owner)
            print(f"✅ Created owner: {owner.email} (id={owner.id}, business_id={owner.business_id})")

        # ----------------------------
        # 3) Customers (idempotent)
        # ----------------------------
        created_customers = []
        for c in customers_seed:
            existing = (
                db.query(Customer)
                .filter(Customer.business_id == business.id)
                .filter(Customer.name == c["name"])
                .first()
            )
            if existing:
                created_customers.append(existing)
                continue

            customer = Customer(
                name=c["name"],
                phone=c.get("phone"),
                business_id=business.id,
            )
            if hasattr(Customer, "created_at"):
                customer.created_at = _now()

            db.add(customer)
            db.flush()
            created_customers.append(customer)

        db.commit()
        print(f"✅ Customers ready for business_id={business.id}: {len(created_customers)}")

        cust_by_name = {c.name: c for c in created_customers}

        # ----------------------------
        # 4) Sales (idempotent)
        # ----------------------------
        created_sales = 0
        for s in sales_seed:
            cust = cust_by_name.get(s["customer"])
            if not cust:
                continue

            q = (
                db.query(Sale)
                .filter(Sale.business_id == business.id)
                .filter(Sale.customer_id == cust.id)
                .filter(getattr(Sale, method_field) == s["method"])
                .filter(getattr(Sale, amount_field) == s["amount"])
            )

            # optional: avoid duplicates within same day if created_at exists
            if has_sale_created_at:
                today = datetime.now(timezone.utc).date()
                start_of_day = datetime(today.year, today.month, today.day, tzinfo=timezone.utc)
                q = q.filter(Sale.created_at >= start_of_day)

            if q.first():
                continue

            sale_kwargs = {
                "business_id": business.id,
                "customer_id": cust.id,
                "created_by": owner.id,  # required by your constraint
                method_field: s["method"],
                amount_field: s["amount"],
            }
            if has_sale_created_at:
                sale_kwargs["created_at"] = _now()

            db.add(Sale(**sale_kwargs))
            created_sales += 1

        db.commit()
        print(
            f"✅ Sales inserted: {created_sales} "
            f"(business_id={business.id}, amount_field={amount_field}, method_field={method_field})"
        )


if __name__ == "__main__":
    main()
