from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, not_
from typing import List

from app.db.database import get_db
from app.models import User
from app.schemas import UserResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[UserResponse])
async def search_users(
    workspace_id: int = Query(..., description="Exclude members of this workspace from results"),
    query: str = Query("", min_length=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models import WorkspaceMember
    from fastapi import HTTPException

    # Verify current user is part of the workspace or is a super admin
    member = await db.scalar(select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    ))
    if not member and not current_user.is_super_admin:
        raise HTTPException(status_code=403, detail="Not authorized to search this workspace")

    # Subquery: IDs of users already in the workspace
    existing_member_ids_subq = (
        select(WorkspaceMember.user_id)
        .where(WorkspaceMember.workspace_id == workspace_id)
        .scalar_subquery()
    )

    # Return all platform users who are NOT already workspace members
    stmt = select(User).where(not_(User.id.in_(existing_member_ids_subq)))

    if query:
        search = f"%{query}%"
        stmt = stmt.where(or_(
            User.name.ilike(search),
            User.email.ilike(search)
        ))

    stmt = stmt.order_by(User.name).limit(50)
    result = await db.execute(stmt)
    return result.scalars().all()
