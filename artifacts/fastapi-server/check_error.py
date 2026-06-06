import asyncio
from app.db.database import SessionLocal
from app.models import ProjectInvitation, Notification, NotificationType, ProjectMemberRole
from datetime import datetime, timedelta, timezone

async def test():
    async with SessionLocal() as db:
        try:
            inv = ProjectInvitation(
                project_id=1,
                email="test@example.com",
                invited_by_id=3,
                role=ProjectMemberRole.member,
                token="test_token",
                expires_at=datetime.now(timezone.utc) + timedelta(days=7)
            )
            db.add(inv)
            
            notif = Notification(
                type=NotificationType.project_invite,
                title="Project Invitation",
                message="test",
                user_id=3
            )
            db.add(notif)
            
            await db.commit()
            print("Success")
        except Exception as e:
            print(f"Error type: {type(e)}")
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
