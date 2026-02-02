from typing import List  # <--- Added this for list responses
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.deps import get_db
from app.core.roles import require_owner
from app.models.user import User
from app.schemas.user import UserCreate, UserOut
from app.core.security import hash_password
from app.core.dependencies import get_current_user

router = APIRouter()

@router.get("/me", response_model=UserOut)
def read_me(current_user = Depends(get_current_user)):
    return current_user

# --- NEW ENDPOINT: LIST STAFF ---
# This allows the frontend to populate the table of employees
@router.get("/staff", response_model=List[UserOut])
def read_staff(
    db: Session = Depends(get_db),
    owner = Depends(require_owner) # Encapsulates "Only Owners allowed"
):
    # Find all users in THIS owner's business who have the role 'staff'
    staff_members = db.query(User).filter(
        User.business_id == owner.business_id,
        User.role == "staff"
    ).all()
    return staff_members

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
        role="staff", # <--- Force the role to be staff
        business_id=owner.business_id # <--- Link to Owner's business
    )

    db.add(staff)
    db.commit()
    db.refresh(staff)

    return staff