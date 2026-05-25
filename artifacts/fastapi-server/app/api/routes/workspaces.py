from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.db.database import get_db
from app.models import Workspace, WorkspaceMember, User, WorkspaceMemberRole
from app.schemas import (
    WorkspaceResponseItem, CreateWorkspaceBody, UpdateWorkspaceBody, MessageResponse
)
from app.api.deps import get_current_user, require_workspace_role
from app.core.cache import get_cache, set_cache, delete_cache_pattern

router = APIRouter()

OwnerOnly = Depends(require_workspace_role(["owner"]))

@router.get("", response_model=List[WorkspaceResponseItem])
async def list_workspaces(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    cache_key = f"user:{current_user.id}:workspaces"
    
    # 1. Attempt to fetch from Redis
    cached_workspaces = await get_cache(cache_key)
    if cached_workspaces:
        return cached_workspaces

    # 2. Cache miss, query MySQL Database
    stmt = (
        select(Workspace)
        .join(WorkspaceMember, Workspace.id == WorkspaceMember.workspace_id)
        .filter(WorkspaceMember.user_id == current_user.id)
    )
    result = await db.execute(stmt)
    workspaces = result.scalars().all()
    
    # 3. Serialize and save to cache for 5 minutes
    # We serialize manually for caching, FastAPI handles validation dynamically
    serialized = [
        {
            "id": w.id, 
            "name": w.name, 
            "description": w.description, 
            "owner_id": w.owner_id, 
            "project_id": w.project_id,
            "created_at": w.created_at.isoformat()
        } for w in workspaces
    ]
    await set_cache(cache_key, serialized, expire_seconds=300)
    
    return workspaces

@router.post("", response_model=WorkspaceResponseItem, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    workspace_in: CreateWorkspaceBody, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    new_workspace = Workspace(
        name=workspace_in.name,
        description=workspace_in.description,
        owner_id=current_user.id,
        project_id=workspace_in.project_id if hasattr(workspace_in, 'project_id') else None
    )
    db.add(new_workspace)
    await db.commit()
    await db.refresh(new_workspace)
    
    member = WorkspaceMember(
        user_id=current_user.id,
        workspace_id=new_workspace.id,
        role=WorkspaceMemberRole.owner
    )
    db.add(member)
    await db.commit()
    
    # 4. Invalidate the user's workspace cache because they just added one
    await delete_cache_pattern(f"user:{current_user.id}:workspaces*")
    
    return new_workspace

@router.patch("/{workspace_id}", response_model=WorkspaceResponseItem)
async def update_workspace(
    workspace_id: int,
    workspace_update: UpdateWorkspaceBody,
    db: AsyncSession = Depends(get_db),
    _: WorkspaceMember = OwnerOnly
):
    ws = await db.scalar(select(Workspace).where(Workspace.id == workspace_id))
    if not ws:
        raise HTTPException(404, "Workspace not found")
        
    update_data = workspace_update.model_dump(exclude_unset=True)
    if "name" in update_data: ws.name = update_data["name"]
    if "description" in update_data: ws.description = update_data["description"]
    
    await db.commit()
    await db.refresh(ws)
    return ws

@router.delete("/{workspace_id}", response_model=MessageResponse)
async def delete_workspace(
    workspace_id: int,
    db: AsyncSession = Depends(get_db),
    _: WorkspaceMember = OwnerOnly
):
    ws = await db.scalar(select(Workspace).where(Workspace.id == workspace_id))
    if not ws:
        raise HTTPException(404, "Workspace not found")
        
    await db.delete(ws)
    await db.commit()
    return MessageResponse(message="Workspace deleted")
