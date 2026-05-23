from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.db.database import get_db
from app.models import User, Notification
from app.schemas import NotificationResponseItem
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[NotificationResponseItem])
async def list_notifications(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Notification).where(Notification.user_id == current_user.id).order_by(Notification.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

from app.schemas import MessageResponse

@router.patch("/{notification_id}/read", response_model=MessageResponse)
async def mark_notification_read(notification_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return MessageResponse(message="Marked read")

@router.post("/read-all", response_model=MessageResponse)
async def mark_all_notifications_read(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return MessageResponse(message="Marked all read")
