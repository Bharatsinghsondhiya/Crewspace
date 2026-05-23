from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.database import get_db
from app.models import User
from app.schemas import UserResponse, UpdateProfileBody, ChangePasswordBody, MessageResponse
from app.core import security
from app.api.deps import get_current_user

router = APIRouter()

@router.patch("", response_model=UserResponse)
async def update_profile(
    profile_update: UpdateProfileBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    update_data = profile_update.model_dump(exclude_unset=True)
    
    if "name" in update_data:
        current_user.name = update_data["name"]
    if "avatar_url" in update_data:
        current_user.avatar_url = update_data["avatar_url"]
        
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    
    return current_user

@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    password_input: ChangePasswordBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not security.verify_password(password_input.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
        
    current_user.password_hash = security.get_password_hash(password_input.new_password)
    db.add(current_user)
    await db.commit()
    
    return MessageResponse(message="Password successfully updated")
