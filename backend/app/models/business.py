from sqlalchemy import Column, Integer, String
from app.db.base import Base

class Business(Base):
    __tablename__ = "businesses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
