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
    if current_user.role.value != "admin":
        return AdminStatsResponse(
            total_users=0, total_workspaces=0, total_tasks=0, 
            completed_tasks=0, active_users=0, users_by_role=[], tasks_by_status=[]
        )
        
    total_users = await db.scalar(select(func.count(User.id)))
    total_workspaces = await db.scalar(select(func.count(Workspace.id)))
    total_tasks = await db.scalar(select(func.count(Task.id)))
    completed_tasks = await db.scalar(select(func.count(Task.id)).where(Task.status == TaskStatus.completed))
    
    users_by_role_rows = await db.execute(select(User.role, func.count(User.id)).group_by(User.role))
    users_by_role = [{"label": r[0].value if hasattr(r[0], 'value') else r[0], "count": r[1]} for r in users_by_role_rows.all()]
    
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
    if current_user.role.value != "admin":
        return []
    result = await db.execute(select(User))
    return result.scalars().all()

from pydantic import BaseModel
class UpdateRoleBody(BaseModel):
    role: str

@router.patch("/users/{user_id}/role", response_model=UserResponse)
async def admin_update_user_role(user_id: int, body: UpdateRoleBody, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.models import UserRole
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    user = await db.scalar(select(User).where(User.id == user_id))
    user.role = UserRole(body.role)
    await db.commit()
    return user

@router.delete("/users/{user_id}")
async def admin_delete_user(user_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    user = await db.scalar(select(User).where(User.id == user_id))
    await db.delete(user)
    await db.commit()
    return {"message": "User deleted"}
