from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.db.database import get_db
from app.models import User, Workspace, Task, TaskStatus
from app.schemas import AdminStatsResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Only return real stats if admin
    if not current_user.is_super_admin:
        return AdminStatsResponse(
            total_users=0, total_workspaces=0, total_tasks=0, 
            completed_tasks=0, active_users=0, users_by_role=[], tasks_by_status=[]
        )
        
    total_users = await db.scalar(select(func.count(User.id)))
    total_workspaces = await db.scalar(select(func.count(Workspace.id)))
    total_tasks = await db.scalar(select(func.count(Task.id)))
    completed_tasks = await db.scalar(select(func.count(Task.id)).where(Task.status == TaskStatus.completed))
    
    users_by_role_rows = await db.execute(select(User.is_super_admin, func.count(User.id)).group_by(User.is_super_admin))
    users_by_role = [{"label": "Admin" if r[0] else "User", "count": r[1]} for r in users_by_role_rows.all()]
    
    tasks_by_status_rows = await db.execute(select(Task.status, func.count(Task.id)).group_by(Task.status))
    tasks_by_status = [{"label": r[0].value if hasattr(r[0], 'value') else r[0], "count": r[1]} for r in tasks_by_status_rows.all()]
    
    return AdminStatsResponse(
        total_users=total_users or 0,
        total_workspaces=total_workspaces or 0,
        total_tasks=total_tasks or 0,
        completed_tasks=completed_tasks or 0,
        active_users=total_users or 0,
        users_by_role=users_by_role,
        tasks_by_status=tasks_by_status
    )

from app.schemas import UserResponse

@router.get("/users", response_model=list[UserResponse])
async def admin_list_users(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not current_user.is_super_admin:
        return []
    result = await db.execute(select(User))
    return result.scalars().all()

from pydantic import BaseModel
class UpdateRoleBody(BaseModel):
    is_super_admin: bool

@router.patch("/users/{user_id}/role", response_model=UserResponse)
async def admin_update_user_role(user_id: int, body: UpdateRoleBody, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not current_user.is_super_admin:
        raise HTTPException(status_code=403, detail="Forbidden")
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot change your own admin role")
    user = await db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_super_admin = body.is_super_admin
    await db.commit()
    return user

@router.delete("/users/{user_id}")
async def admin_delete_user(user_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not current_user.is_super_admin:
        raise HTTPException(status_code=403, detail="Forbidden")
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account via admin panel")
    user = await db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()
    return {"message": "User deleted"}
