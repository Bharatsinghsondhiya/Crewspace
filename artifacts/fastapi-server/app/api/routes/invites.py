from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timezone

from app.db.database import get_db
from app.models import WorkspaceInvitation, WorkspaceMember, User
from app.schemas import WorkspaceInvitationResponse, AcceptInviteBody, WorkspaceMemberResponse, MessageResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/{token}", response_model=WorkspaceInvitationResponse)
async def get_invite(token: str, db: AsyncSession = Depends(get_db)):
    stmt = select(WorkspaceInvitation).where(WorkspaceInvitation.token == token)
    invite = await db.scalar(stmt)
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation not found")
        
    if invite.accepted:
        raise HTTPException(status_code=400, detail="Invitation already accepted")
        
    now = datetime.now(timezone.utc)
    if invite.expires_at.tzinfo is None:
        now = now.replace(tzinfo=None)
        
    if invite.expires_at < now:
        raise HTTPException(status_code=400, detail="Invitation expired")
        
    return invite

@router.post("/accept", response_model=MessageResponse)
async def accept_invite(
    body: AcceptInviteBody, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    stmt = select(WorkspaceInvitation).where(WorkspaceInvitation.token == body.token)
    invite = await db.scalar(stmt)
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation not found")
        
    if invite.accepted:
        raise HTTPException(status_code=400, detail="Invitation already accepted")
        
    now = datetime.now(timezone.utc)
    if invite.expires_at.tzinfo is None:
        now = now.replace(tzinfo=None)
        
    if invite.expires_at < now:
        raise HTTPException(status_code=400, detail="Invitation expired")
        
    # Check if user email matches the invite
    if invite.email.lower() != current_user.email.lower():
        raise HTTPException(status_code=400, detail="This invitation is for a different email address")

    # Check if user is already a member
    member_stmt = select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == invite.workspace_id,
        WorkspaceMember.user_id == current_user.id
    )
    existing_member = await db.scalar(member_stmt)
    if existing_member:
        raise HTTPException(status_code=400, detail="You are already a member of this workspace")
        
    # Create the member
    new_member = WorkspaceMember(
        user_id=current_user.id,
        workspace_id=invite.workspace_id,
        role=invite.role
    )
    db.add(new_member)
    
    # Mark invite as accepted
    invite.accepted = True
    await db.commit()
    
    return MessageResponse(message="Successfully joined the workspace")
