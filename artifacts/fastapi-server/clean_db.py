import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.config import settings

async def clean_data():
    print(f"Connecting to {settings.DATABASE_URL}...")
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Disable foreign key checks temporarily for a clean wipe
        await session.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        
        # Truncate tables related to workspaces and tasks
        await session.execute(text("TRUNCATE TABLE tasks;"))
        await session.execute(text("TRUNCATE TABLE workspace_members;"))
        await session.execute(text("TRUNCATE TABLE workspaces;"))
        await session.execute(text("TRUNCATE TABLE notifications;"))
        await session.execute(text("TRUNCATE TABLE activity_logs;"))
        
        # Re-enable foreign key checks
        await session.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        await session.commit()
        print("Successfully cleared all workspace, task, notification, and activity data.")

if __name__ == "__main__":
    asyncio.run(clean_data())
