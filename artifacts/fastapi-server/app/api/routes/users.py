from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_
from typing import List

from app.db.database import get_db
from app.models import User
from app.schemas import UserResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[UserResponse])
async def search_users(
    query: str = Query("", min_length=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models import UserRole
    from sqlalchemy import and_
    
    if not query:
        stmt = select(User).limit(50)
    else:
        search = f"%{query}%"
        stmt = select(User).where(or_(
            User.name.ilike(search),
            User.email.ilike(search)
        )).limit(50)
        
    result = await db.execute(stmt)
    return result.scalars().all()
