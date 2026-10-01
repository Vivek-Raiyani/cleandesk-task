from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from core.deps import get_db
from models.user import User
from schemas.user import UserResponse

users_router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@users_router.get("", response_model=List[UserResponse])
def get_users(search: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(User)
    if search:
        query = query.filter(User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))
    return query.all()
