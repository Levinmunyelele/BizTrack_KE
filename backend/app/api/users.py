from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.deps import get_db
from app.models.user import User
from app.schemas.user import UserOut

router = APIRouter()

@router.get("/me", response_model=UserOut)
def read_me(db: Session = Depends(get_db)):
    user = db.query(User).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="No users found. Please register first."
        )

    return user
