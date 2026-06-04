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
        return []
        
    if current_user.role == UserRole.super_admin:
        search = f"%{query}%"
        stmt = select(User).where(or_(
            User.name.ilike(search),
            User.email.ilike(search)
        )).limit(50)
        result = await db.execute(stmt)
        return result.scalars().all()

    # Standard user search rules:
    # 1. Exact email lookup (allows inviting anyone by typing their email)
    # 2. Name/email matching for users who share at least one project with the current_user
    
    is_email_query = "@" in query and "." in query
    
    from app.models import ProjectMember
    from sqlalchemy.orm import aliased
    pm1 = aliased(ProjectMember)
    pm2 = aliased(ProjectMember)
    
    # Subquery to get user IDs of all members in projects where current_user is a member
    shared_users_stmt = (
        select(pm2.user_id)
        .join(pm1, pm1.project_id == pm2.project_id)
        .where(pm1.user_id == current_user.id)
    )
    
    search_pattern = f"%{query}%"
    
    if is_email_query:
        stmt = select(User).where(or_(
            User.email == query,
            and_(
                User.id.in_(shared_users_stmt),
                or_(
                    User.name.ilike(search_pattern),
                    User.email.ilike(search_pattern)
                )
            )
        )).limit(50)
    else:
        stmt = select(User).where(and_(
            User.id.in_(shared_users_stmt),
            or_(
                User.name.ilike(search_pattern),
                User.email.ilike(search_pattern)
            )
        )).limit(50)
        
    result = await db.execute(stmt)
    return result.scalars().all()
