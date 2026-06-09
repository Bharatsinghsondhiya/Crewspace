from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.db.database import get_db
from app.api.deps import get_current_user, verify_workspace_admin, verify_project_member, verify_project_admin
from app.models import User, Project, ProjectMember, ProjectMemberRole, ProjectInvitation, Notification, NotificationType, Task, TaskStatus, TaskPriority, ActivityLog
from app.schemas import (
    ProjectResponseItem, 
    CreateProjectBody, 
    UpdateProjectBody, 
    ProjectMemberResponse, 
    InviteProjectMemberBody,
    UpdateProjectMemberRoleBody,
    MessageResponse,
    TaskResponseItem, CreateTaskBody, UpdateTaskBody
)
import secrets
import json
from datetime import datetime, timedelta, timezone

router = APIRouter()

def require_admin(user: User):
    if not user.is_super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only platform admins can manage projects")

@router.post("", response_model=ProjectResponseItem, status_code=status.HTTP_201_CREATED)
async def create_project(body: CreateProjectBody, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    
    await verify_workspace_admin(workspace_id=body.workspace_id, current_user=current_user, db=db)
    
    project = Project(
        name=body.name,
        description=body.description,
        workspace_id=body.workspace_id,
        created_by_id=current_user.id
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)

    member = ProjectMember(
        project_id=project.id,
        user_id=current_user.id,
        role=ProjectMemberRole.admin
    )
    db.add(member)
    await db.commit()

    return project

@router.get("", response_model=List[ProjectResponseItem])
async def get_projects(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # To get my_role, we need to outerjoin ProjectMember for the current user
    from sqlalchemy.orm import aliased
    pm = aliased(ProjectMember)
    stmt = (
        select(Project, pm.role)
        .outerjoin(pm, (Project.id == pm.project_id) & (pm.user_id == current_user.id))
    )
    
    if not current_user.is_super_admin:
        stmt = stmt.filter(pm.user_id == current_user.id)
        
    result = await db.execute(stmt)
    rows = result.all()
    
    response = []
    for proj, role in rows:
        proj.my_role = role
        response.append(proj)
        
    return response

@router.get("/{project_id}", response_model=ProjectResponseItem)
async def get_project(project_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Project).where(Project.id == project_id)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    if not current_user.is_super_admin:
        member_stmt = select(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == current_user.id)
        member_res = await db.execute(member_stmt)
        member = member_res.scalar_one_or_none()
        if not member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this project")
        project.my_role = member.role
    else:
        # If admin, fetch their role if they are a member, else None
        member_stmt = select(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == current_user.id)
        member_res = await db.execute(member_stmt)
        member = member_res.scalar_one_or_none()
        if member:
            project.my_role = member.role
            
    return project

@router.patch("/{project_id}", response_model=ProjectResponseItem)
async def update_project(project_id: int, body: UpdateProjectBody, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Project).where(Project.id == project_id)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    member_stmt = select(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == current_user.id)
    member_res = await db.execute(member_stmt)
    member = member_res.scalar_one_or_none()
    
    if not current_user.is_super_admin and (not member or member.role != ProjectMemberRole.admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update project")

    if body.name is not None:
        project.name = body.name
    if body.description is not None:
        project.description = body.description

    await db.commit()
    await db.refresh(project)
    return project

@router.delete("/{project_id}", response_model=MessageResponse)
async def delete_project(project_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Project).where(Project.id == project_id)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    member_stmt = select(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == current_user.id)
    member_res = await db.execute(member_stmt)
    member = member_res.scalar_one_or_none()
    
    if not current_user.is_super_admin and (not member or member.role != ProjectMemberRole.admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owner can delete project")

    await db.delete(project)
    await db.commit()
    return MessageResponse(message="Project deleted successfully")

@router.get("/{project_id}/members", response_model=List[ProjectMemberResponse])
async def get_project_members(project_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_super_admin:
        member_stmt = select(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == current_user.id)
        member_res = await db.execute(member_stmt)
        if not member_res.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this project")
            
    stmt = select(ProjectMember).filter(ProjectMember.project_id == project_id)
    result = await db.execute(stmt)
    # Eager load user relationship would be better, but schemas expect user.
    # For simplicity let's rely on lazy loading or modify query. Since it's async, lazy load might fail.
    # Let's eager load user.
    from sqlalchemy.orm import selectinload
    stmt = select(ProjectMember).options(selectinload(ProjectMember.user)).filter(ProjectMember.project_id == project_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/{project_id}/members", response_model=MessageResponse)
async def add_project_member(project_id: int, body: InviteProjectMemberBody, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    member_stmt = select(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == current_user.id)
    member_res = await db.execute(member_stmt)
    member = member_res.scalar_one_or_none()
    
    if not current_user.is_super_admin and (not member or member.role != ProjectMemberRole.admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to invite members")

    user_stmt = select(User).where(User.email == body.email)
    user_res = await db.execute(user_stmt)
    user_to_add = user_res.scalar_one_or_none()
    if not user_to_add:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    existing_stmt = select(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == user_to_add.id)
    existing_res = await db.execute(existing_stmt)
    if existing_res.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already a member")
        
    project = await db.scalar(select(Project).where(Project.id == project_id))

    # Create invitation
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(days=7)
    invitation = ProjectInvitation(
        project_id=project_id,
        email=body.email,
        invited_by_id=current_user.id,
        role=body.role,
        token=token,
        expires_at=expires
    )
    db.add(invitation)
    
    # Create notification with JSON message payload to store token
    message_payload = {
        "text": f"You have been invited to join project '{project.name}' as a {body.role}.",
        "token": token,
        "projectId": project_id
    }
    notification = Notification(
        type=NotificationType.project_invite,
        title="Project Invitation",
        message=json.dumps(message_payload),
        user_id=user_to_add.id,
    )
    db.add(notification)
    
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to send invitation. Please try again.")
        
    return MessageResponse(message="Invitation sent successfully")

@router.post("/invitations/{token}/accept", response_model=MessageResponse)
async def accept_project_invite(token: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(ProjectInvitation).where(ProjectInvitation.token == token)
    res = await db.execute(stmt)
    invitation = res.scalar_one_or_none()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
        
    if invitation.email.lower() != current_user.email.lower():
        raise HTTPException(status_code=403, detail="Not authorized to accept this invitation")
        
    if invitation.accepted:
        raise HTTPException(status_code=400, detail="Invitation already accepted")
        
    # Check expiry
    expires_at = invitation.expires_at if invitation.expires_at.tzinfo else invitation.expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invitation expired")
        
    # Create member
    new_member = ProjectMember(
        project_id=invitation.project_id,
        user_id=current_user.id,
        role=invitation.role
    )
    db.add(new_member)
    
    invitation.accepted = True
    await db.commit()
    
    return MessageResponse(message="Joined project successfully")

@router.delete("/{project_id}/members/{user_id}", response_model=MessageResponse)
async def remove_project_member(project_id: int, user_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    member_stmt = select(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == current_user.id)
    member_res = await db.execute(member_stmt)
    member = member_res.scalar_one_or_none()
    
    if not current_user.is_super_admin and (not member or member.role != ProjectMemberRole.admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to remove members")

    rm_stmt = select(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == user_id)
    rm_res = await db.execute(rm_stmt)
    member_to_remove = rm_res.scalar_one_or_none()
    
    if not member_to_remove:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    # Prevent removal of the project creator (owner) — fetch project to check
    project = await db.scalar(select(Project).where(Project.id == project_id))
    if project and project.created_by_id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove the project creator")

    # Prevent an admin from removing themselves if they're the only admin
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove yourself from the project")

    await db.delete(member_to_remove)
    await db.commit()
    return MessageResponse(message="Member removed successfully")

@router.put("/{project_id}/members/{user_id}/role", response_model=ProjectMemberResponse)
async def update_project_member_role(project_id: int, user_id: int, body: UpdateProjectMemberRoleBody, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    member_stmt = select(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == current_user.id)
    member_res = await db.execute(member_stmt)
    member = member_res.scalar_one_or_none()
    
    if not current_user.is_super_admin and (not member or member.role != ProjectMemberRole.admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update roles")

    from sqlalchemy.orm import selectinload
    rm_stmt = select(ProjectMember).options(selectinload(ProjectMember.user)).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == user_id)
    rm_res = await db.execute(rm_stmt)
    member_to_update = rm_res.scalar_one_or_none()
    
    if not member_to_update:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    if member_to_update.role == ProjectMemberRole.admin:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot change owner role")

    member_to_update.role = body.role
    await db.commit()
    await db.refresh(member_to_update)
    return member_to_update

@router.get("/{project_id}/tasks", response_model=List[TaskResponseItem])
async def list_project_tasks(project_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user), _ = Depends(verify_project_member)):
    from sqlalchemy.orm import selectinload
    stmt = select(Task).options(selectinload(Task.assignee), selectinload(Task.created_by)).where(Task.project_id == project_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/{project_id}/tasks", response_model=TaskResponseItem)
async def create_task(project_id: int, task_in: CreateTaskBody, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user), _ = Depends(verify_project_member)):
    from sqlalchemy.orm import selectinload
    project = await db.scalar(select(Project).where(Project.id == project_id))
    task = Task(
        title=task_in.title,
        description=task_in.description,
        status=TaskStatus(task_in.status),
        priority=TaskPriority(task_in.priority),
        assignee_id=task_in.assignee_id,
        project_id=project_id,
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
        workspace_id=project.workspace_id if project else None,
        description=f"Task '{task.title}' was created"
    )
    db.add(activity)
    await db.commit()
    
    stmt = select(Task).options(selectinload(Task.assignee), selectinload(Task.created_by)).where(Task.id == task.id)
    task = await db.scalar(stmt)
    return task

@router.patch("/{project_id}/tasks/{task_id}", response_model=TaskResponseItem)
async def update_task(project_id: int, task_id: int, task_in: UpdateTaskBody, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user), member = Depends(verify_project_member)):
    from sqlalchemy.orm import selectinload
    task = await db.scalar(select(Task).options(selectinload(Task.project)).where(Task.id == task_id))
    if not task or task.project_id != project_id:
        raise HTTPException(404, "Task not found in this project")
        
    update_data = task_in.model_dump(exclude_unset=True)
    
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
        user_id=current_user.id,
        workspace_id=task.project.workspace_id if task.project else None,
        description=f"Task '{task.title}' was updated"
    )
    db.add(activity)
    await db.commit()
    
    stmt = select(Task).options(selectinload(Task.assignee), selectinload(Task.created_by)).where(Task.id == task_id)
    return await db.scalar(stmt)

@router.get("/{project_id}/tasks/{task_id}", response_model=TaskResponseItem)
async def get_task(project_id: int, task_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user), _ = Depends(verify_project_member)):
    from sqlalchemy.orm import selectinload
    stmt = select(Task).options(selectinload(Task.assignee), selectinload(Task.created_by)).where(Task.id == task_id)
    task = await db.scalar(stmt)
    if not task or task.project_id != project_id:
        raise HTTPException(404, "Task not found in this project")
    return task

@router.delete("/{project_id}/tasks/{task_id}")
async def delete_task(project_id: int, task_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user), _ = Depends(verify_project_admin)):
    task = await db.scalar(select(Task).where(Task.id == task_id))
    if not task or task.project_id != project_id:
        raise HTTPException(404, "Task not found in this project")
    await db.delete(task)
    await db.commit()
    return {"message": "Task deleted"}
