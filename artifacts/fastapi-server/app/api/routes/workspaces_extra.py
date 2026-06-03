from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
import secrets
from datetime import datetime, timedelta, timezone

from app.db.database import get_db
from app.models import Workspace, WorkspaceMember, User, Task, TaskStatus, TaskPriority, WorkspaceInvitation, Notification, NotificationType, ActivityLog
import json
from app.schemas import (
    WorkspaceResponseItem, WorkspaceMemberResponse, TaskResponseItem, 
    CreateTaskBody, UpdateTaskBody, InviteMemberBody, WorkspaceInvitationResponse,
    WorkspaceAnalyticsResponse
)
from app.api.deps import get_current_user, require_workspace_role

router = APIRouter()

# Dependency aliases for brevity
AnyMember = Depends(require_workspace_role(["owner", "manager", "member", "viewer"]))
ManagerOrOwner = Depends(require_workspace_role(["owner", "manager"]))
OwnerOnly = Depends(require_workspace_role(["owner"]))

@router.get("/{workspace_id}", response_model=WorkspaceResponseItem)
async def get_workspace(workspace_id: int, db: AsyncSession = Depends(get_db), _: WorkspaceMember = AnyMember):
    ws = await db.scalar(select(Workspace).where(Workspace.id == workspace_id))
    if not ws:
        raise HTTPException(404, "Workspace not found")
    return ws

@router.get("/{workspace_id}/members", response_model=List[WorkspaceMemberResponse])
async def get_workspace_members(workspace_id: int, db: AsyncSession = Depends(get_db), _: WorkspaceMember = AnyMember):
    stmt = select(WorkspaceMember).options(selectinload(WorkspaceMember.user)).where(WorkspaceMember.workspace_id == workspace_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/{workspace_id}/invites", response_model=WorkspaceInvitationResponse)
async def create_invite(
    workspace_id: int, 
    body: InviteMemberBody, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user), 
    _: WorkspaceMember = ManagerOrOwner
):
    # Look up user on platform
    target_user = await db.scalar(select(User).where(User.email == body.email))
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found on platform")
        
    # Check if already a member
    existing_member = await db.scalar(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == target_user.id
        )
    )
    if existing_member:
        raise HTTPException(status_code=400, detail="User is already a member of this workspace")
        
    # Check for pending invites
    existing_invite = await db.scalar(
        select(WorkspaceInvitation).where(
            WorkspaceInvitation.workspace_id == workspace_id,
            WorkspaceInvitation.email == body.email,
            WorkspaceInvitation.accepted == False
        )
    )
    if existing_invite:
        now = datetime.now(timezone.utc)
        if existing_invite.expires_at.tzinfo is None:
            now = now.replace(tzinfo=None)
        if existing_invite.expires_at > now:
            raise HTTPException(status_code=400, detail="User already has a pending invitation")

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    invite = WorkspaceInvitation(
        workspace_id=workspace_id,
        email=body.email,
        invited_by_id=current_user.id,
        role=body.role,
        token=token,
        expires_at=expires_at
    )
    db.add(invite)
    
    # Get workspace name for the notification
    workspace = await db.scalar(select(Workspace).where(Workspace.id == workspace_id))
    
    # Create platform notification with token embedded in message
    msg_data = {
        "text": f"{workspace.name} invited you to join as {body.role}",
        "token": token,
        "inviter_name": current_user.name,
        "workspace_name": workspace.name,
        "role": body.role
    }
    notification = Notification(
        type=NotificationType.workspace_invite,
        title="Workspace Invitation",
        message=json.dumps(msg_data),
        user_id=target_user.id,
        workspace_id=workspace_id,
    )
    db.add(notification)
    
    await db.commit()
    await db.refresh(invite)
    return invite

@router.get("/{workspace_id}/tasks", response_model=List[TaskResponseItem])
async def list_workspace_tasks(workspace_id: int, db: AsyncSession = Depends(get_db), _: WorkspaceMember = AnyMember):
    stmt = select(Task).options(selectinload(Task.assignee), selectinload(Task.created_by)).where(Task.workspace_id == workspace_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/{workspace_id}/tasks", response_model=TaskResponseItem)
async def create_task(workspace_id: int, task_in: CreateTaskBody, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user), _: WorkspaceMember = ManagerOrOwner):
    task = Task(
        title=task_in.title,
        description=task_in.description,
        status=TaskStatus(task_in.status),
        priority=TaskPriority(task_in.priority),
        assignee_id=task_in.assignee_id,
        workspace_id=workspace_id,
        created_by_id=current_user.id
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    
    
    activity = ActivityLog(
        action="created task",
        entity_type="task",
        entity_id=task.id,
        user_id=current_user.id,
        workspace_id=workspace_id,
        description=f"Task '{task.title}' was created"
    )
    db.add(activity)
    await db.commit()
    
    stmt = select(Task).options(selectinload(Task.assignee), selectinload(Task.created_by)).where(Task.id == task.id)
    task = await db.scalar(stmt)
    return task

@router.patch("/{workspace_id}/tasks/{task_id}", response_model=TaskResponseItem)
async def update_task(workspace_id: int, task_id: int, task_in: UpdateTaskBody, db: AsyncSession = Depends(get_db), member: WorkspaceMember = AnyMember):
    task = await db.scalar(select(Task).where(Task.id == task_id))
    if not task or task.workspace_id != workspace_id:
        raise HTTPException(404, "Task not found in this workspace")
        
    update_data = task_in.model_dump(exclude_unset=True)
    
    is_manager_or_owner = member.role.value in ["owner", "manager"]
    
    # If member is not a manager/owner, they can ONLY update status, and ONLY if they are assigned.
    if not is_manager_or_owner:
        if task.assignee_id != member.user_id:
            raise HTTPException(403, "You can only update tasks assigned to you")
        # Check if they are trying to update forbidden fields
        forbidden_keys = set(update_data.keys()) - {"status"}
        if forbidden_keys:
            raise HTTPException(403, "Members can only update task status")

    if "title" in update_data: task.title = update_data["title"]
    if "description" in update_data: task.description = update_data["description"]
    if "status" in update_data: 
        val = update_data["status"]
        task.status = TaskStatus(val.value if hasattr(val, "value") else val)
    if "priority" in update_data: 
        val = update_data["priority"]
        task.priority = TaskPriority(val.value if hasattr(val, "value") else val)
    if "assignee_id" in update_data: task.assignee_id = update_data["assignee_id"]
    if "due_date" in update_data: task.due_date = update_data["due_date"]
    
    activity = ActivityLog(
        action="updated task",
        entity_type="task",
        entity_id=task.id,
        user_id=member.user_id,
        workspace_id=workspace_id,
        description=f"Task '{task.title}' was updated"
    )
    db.add(activity)
    await db.commit()
    
    stmt = select(Task).options(selectinload(Task.assignee), selectinload(Task.created_by)).where(Task.id == task_id)
    return await db.scalar(stmt)

@router.get("/{workspace_id}/tasks/{task_id}", response_model=TaskResponseItem)
async def get_task(workspace_id: int, task_id: int, db: AsyncSession = Depends(get_db), _: WorkspaceMember = AnyMember):
    stmt = select(Task).options(selectinload(Task.assignee), selectinload(Task.created_by)).where(Task.id == task_id)
    task = await db.scalar(stmt)
    if not task or task.workspace_id != workspace_id:
        raise HTTPException(404, "Task not found in this workspace")
    return task

@router.delete("/{workspace_id}/tasks/{task_id}")
async def delete_task(workspace_id: int, task_id: int, db: AsyncSession = Depends(get_db), _: WorkspaceMember = OwnerOnly):
    task = await db.scalar(select(Task).where(Task.id == task_id))
    if not task or task.workspace_id != workspace_id:
        raise HTTPException(404, "Task not found in this workspace")
    await db.delete(task)
    await db.commit()
    return {"message": "Task deleted"}

@router.patch("/{workspace_id}/members/{user_id}", response_model=WorkspaceMemberResponse)
async def update_member_role(
    workspace_id: int, 
    user_id: int, 
    role: str, 
    db: AsyncSession = Depends(get_db), 
    current_member: WorkspaceMember = OwnerOnly
):
    from app.models import WorkspaceMemberRole
    member_to_update = await db.scalar(select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ))
    if not member_to_update:
        raise HTTPException(404, "Member not found")
        
    try:
        member_to_update.role = WorkspaceMemberRole(role)
    except ValueError:
        raise HTTPException(400, "Invalid role")
        
    await db.commit()
    return member_to_update

@router.delete("/{workspace_id}/members/{user_id}")
async def remove_workspace_member(
    workspace_id: int, 
    user_id: int, 
    db: AsyncSession = Depends(get_db), 
    current_member: WorkspaceMember = OwnerOnly
):
    member_to_remove = await db.scalar(select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ))
    if not member_to_remove:
        raise HTTPException(404, "Member not found")
        
    if member_to_remove.role.value == "owner":
        raise HTTPException(400, "Cannot remove an owner from the workspace")
        
    await db.delete(member_to_remove)
    await db.commit()
    return {"message": "Member removed"}

from sqlalchemy import func

@router.get("/{workspace_id}/analytics", response_model=WorkspaceAnalyticsResponse)
async def get_workspace_analytics(
    workspace_id: int, 
    db: AsyncSession = Depends(get_db), 
    _: WorkspaceMember = AnyMember
):
    total_tasks = await db.scalar(select(func.count(Task.id)).where(Task.workspace_id == workspace_id))
    completed_tasks = await db.scalar(select(func.count(Task.id)).where(Task.workspace_id == workspace_id, Task.status == TaskStatus.completed))
    pending_tasks = await db.scalar(select(func.count(Task.id)).where(Task.workspace_id == workspace_id, Task.status == TaskStatus.pending))
    in_progress_tasks = await db.scalar(select(func.count(Task.id)).where(Task.workspace_id == workspace_id, Task.status == TaskStatus.in_progress))
    member_count = await db.scalar(select(func.count(WorkspaceMember.user_id)).where(WorkspaceMember.workspace_id == workspace_id))
    
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks else 0.0
    
    priority_rows = await db.execute(select(Task.priority, func.count(Task.id)).where(Task.workspace_id == workspace_id).group_by(Task.priority))
    tasks_by_priority = [{"label": row[0].value if hasattr(row[0], 'value') else row[0], "count": row[1]} for row in priority_rows.all()]
    
    member_rows = await db.execute(
        select(User.id, User.name, User.avatar_url, func.count(Task.id))
        .outerjoin(Task, (Task.assignee_id == User.id) & (Task.workspace_id == workspace_id))
        .join(WorkspaceMember, WorkspaceMember.user_id == User.id)
        .where(WorkspaceMember.workspace_id == workspace_id)
        .group_by(User.id)
    )
    
    tasks_by_member = []
    for row in member_rows.all():
        uid, uname, uavatar, tcount = row
        user_completed = await db.scalar(select(func.count(Task.id)).where(Task.assignee_id == uid, Task.workspace_id == workspace_id, Task.status == TaskStatus.completed))
        tasks_by_member.append({
            "user_id": uid,
            "name": uname,
            "avatar_url": uavatar,
            "total_tasks": tcount,
            "completed_tasks": user_completed or 0
        })

    return WorkspaceAnalyticsResponse(
        total_tasks=total_tasks or 0,
        completed_tasks=completed_tasks or 0,
        pending_tasks=pending_tasks or 0,
        in_progress_tasks=in_progress_tasks or 0,
        member_count=member_count or 0,
        completion_rate=completion_rate,
        tasks_by_priority=tasks_by_priority,
        tasks_by_member=tasks_by_member
    )
