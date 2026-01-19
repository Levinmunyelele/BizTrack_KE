from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.deps import get_db
from app.core.roles import require_owner
from app.models.user import User
from app.schemas.user import UserCreate, UserOut
from app.core.security import hash_password

router = APIRouter()

@router.post("/staff", response_model=UserOut)
def create_staff(
    data: UserCreate,
    db: Session = Depends(get_db),
    owner = Depends(require_owner)
):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    staff = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role="staff",
        business_id=owner.business_id
    )

    db.add(staff)
    db.commit()
    db.refresh(staff)

    return staff
