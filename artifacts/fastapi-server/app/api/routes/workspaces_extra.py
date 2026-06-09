from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
import secrets
from datetime import datetime, timedelta, timezone

from app.db.database import get_db
from app.models import Workspace, WorkspaceMember, User, Task, TaskStatus, TaskPriority, WorkspaceInvitation, Notification, NotificationType, ActivityLog, Project, ProjectMember
import json
from app.schemas import (
    WorkspaceResponseItem, WorkspaceMemberResponse, TaskResponseItem, 
    CreateTaskBody, UpdateTaskBody, InviteMemberBody, WorkspaceInvitationResponse,
    WorkspaceAnalyticsResponse, ProjectResponseItem
)
from app.api.deps import get_current_user, require_workspace_role

router = APIRouter()

# Dependency aliases for brevity
AnyMember = Depends(require_workspace_role(["owner", "admin", "member", "viewer"]))
AdminOrOwner = Depends(require_workspace_role(["owner", "admin"]))
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
    _: WorkspaceMember = AdminOrOwner
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

@router.get("/{workspace_id}/projects", response_model=List[ProjectResponseItem])
async def list_workspace_projects(workspace_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user), _: WorkspaceMember = AnyMember):
    from sqlalchemy.orm import aliased
    pm = aliased(ProjectMember)
    stmt = (
        select(Project, pm.role)
        .outerjoin(pm, (Project.id == pm.project_id) & (pm.user_id == current_user.id))
        .where(Project.workspace_id == workspace_id)
    )
    result = await db.execute(stmt)
    rows = result.all()
    response = []
    for proj, role in rows:
        proj.my_role = role
        response.append(proj)
    return response



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
    # Tasks don't have workspace_id — scope via project_id belonging to this workspace
    workspace_project_ids = select(Project.id).where(Project.workspace_id == workspace_id)

    total_tasks = await db.scalar(select(func.count(Task.id)).where(Task.project_id.in_(workspace_project_ids)))
    completed_tasks = await db.scalar(select(func.count(Task.id)).where(Task.project_id.in_(workspace_project_ids), Task.status == TaskStatus.completed))
    pending_tasks = await db.scalar(select(func.count(Task.id)).where(Task.project_id.in_(workspace_project_ids), Task.status == TaskStatus.pending))
    in_progress_tasks = await db.scalar(select(func.count(Task.id)).where(Task.project_id.in_(workspace_project_ids), Task.status == TaskStatus.in_progress))
    member_count = await db.scalar(select(func.count(WorkspaceMember.user_id)).where(WorkspaceMember.workspace_id == workspace_id))
    
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks else 0.0
    
    priority_rows = await db.execute(select(Task.priority, func.count(Task.id)).where(Task.project_id.in_(workspace_project_ids)).group_by(Task.priority))
    tasks_by_priority = [{"label": row[0].value if hasattr(row[0], 'value') else row[0], "count": row[1]} for row in priority_rows.all()]
    
    member_rows = await db.execute(
        select(User.id, User.name, User.avatar_url, func.count(Task.id))
        .outerjoin(Task, (Task.assignee_id == User.id) & (Task.project_id.in_(workspace_project_ids)))
        .join(WorkspaceMember, WorkspaceMember.user_id == User.id)
        .where(WorkspaceMember.workspace_id == workspace_id)
        .group_by(User.id)
    )
    
    tasks_by_member = []
    for row in member_rows.all():
        uid, uname, uavatar, tcount = row
        user_completed = await db.scalar(
            select(func.count(Task.id)).where(
                Task.assignee_id == uid,
                Task.project_id.in_(workspace_project_ids),
                Task.status == TaskStatus.completed
            )
        )
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
