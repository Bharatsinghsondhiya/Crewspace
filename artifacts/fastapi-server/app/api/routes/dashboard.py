from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.db.database import get_db
from app.models import User, WorkspaceMember, Task, TaskStatus, TaskPriority, ActivityLog, Project
from app.schemas import DashboardSummaryResponse
from app.api.deps import get_current_user
from sqlalchemy.orm import selectinload
from sqlalchemy import or_

router = APIRouter()

@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Subquery: project IDs in workspaces the user belongs to
    user_workspace_ids = select(WorkspaceMember.workspace_id).where(WorkspaceMember.user_id == current_user.id)
    user_project_ids = select(Project.id).where(Project.workspace_id.in_(user_workspace_ids))

    # total workspaces user is a member of
    workspace_count = await db.scalar(
        select(func.count(WorkspaceMember.workspace_id)).where(WorkspaceMember.user_id == current_user.id)
    )

    # tasks assigned to user
    my_tasks_count = await db.scalar(
        select(func.count(Task.id)).where(Task.assignee_id == current_user.id)
    )

    my_pending_count = await db.scalar(
        select(func.count(Task.id)).where(Task.assignee_id == current_user.id, Task.status == TaskStatus.pending)
    )

    my_completed_count = await db.scalar(
        select(func.count(Task.id)).where(Task.assignee_id == current_user.id, Task.status == TaskStatus.completed)
    )

    # tasks by priority (across all projects in the user's workspaces)
    high_count = await db.scalar(
        select(func.count(Task.id)).where(Task.project_id.in_(user_project_ids), Task.priority == TaskPriority.high)
    )
    medium_count = await db.scalar(
        select(func.count(Task.id)).where(Task.project_id.in_(user_project_ids), Task.priority == TaskPriority.medium)
    )
    low_count = await db.scalar(
        select(func.count(Task.id)).where(Task.project_id.in_(user_project_ids), Task.priority == TaskPriority.low)
    )

    # recent activity
    stmt = (
        select(ActivityLog)
        .options(selectinload(ActivityLog.user))
        .where(
            or_(
                ActivityLog.user_id == current_user.id,
                ActivityLog.workspace_id.in_(user_workspace_ids)
            )
        )
        .order_by(ActivityLog.created_at.desc())
        .limit(10)
    )
    result = await db.execute(stmt)
    activities = result.scalars().all()

    return DashboardSummaryResponse(
        total_workspaces=workspace_count or 0,
        total_tasks=my_tasks_count or 0,
        my_tasks=my_tasks_count or 0,
        my_pending_tasks=my_pending_count or 0,
        my_completed_tasks=my_completed_count or 0,
        tasks_by_priority={"high": high_count or 0, "medium": medium_count or 0, "low": low_count or 0},
        recent_activity=activities
    )

from typing import List
from app.schemas import TaskResponseItem, ActivityLogResponseItem

@router.get("/my-tasks", response_model=List[TaskResponseItem])
async def get_my_tasks(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Task)
        .options(selectinload(Task.assignee), selectinload(Task.created_by))
        .where(Task.assignee_id == current_user.id)
        .order_by(Task.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/all-tasks", response_model=List[TaskResponseItem])
async def get_all_tasks(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Task has no workspace_id — scope via project_id -> Project.workspace_id
    user_project_ids = (
        select(Project.id)
        .where(Project.workspace_id.in_(
            select(WorkspaceMember.workspace_id).where(WorkspaceMember.user_id == current_user.id)
        ))
    )
    stmt = (
        select(Task)
        .options(selectinload(Task.assignee), selectinload(Task.created_by))
        .where(
            or_(
                Task.created_by_id == current_user.id,
                Task.project_id.in_(user_project_ids)
            )
        )
        .order_by(Task.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/activity", response_model=List[ActivityLogResponseItem])
async def get_my_activity(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = (
        select(ActivityLog)
        .options(selectinload(ActivityLog.user))
        .where(
            or_(
                ActivityLog.user_id == current_user.id,
                ActivityLog.workspace_id.in_(
                    select(WorkspaceMember.workspace_id).where(WorkspaceMember.user_id == current_user.id)
                )
            )
        )
        .order_by(ActivityLog.created_at.desc())
        .limit(50)
    )
    result = await db.execute(stmt)
    return result.scalars().all()
