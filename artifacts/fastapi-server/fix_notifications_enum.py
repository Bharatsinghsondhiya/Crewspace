import asyncio
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import create_async_engine

async def main():
    # Using the existing database connection string found in fix_enum.py
    engine = create_async_engine("mysql+aiomysql://root:bRjBVgOiQJSVjTBeINcRuvBvCpXVtTSF@kodama.proxy.rlwy.net:48190/railway")
    async with engine.begin() as conn:
        await conn.execute(sa.text("ALTER TABLE notifications MODIFY COLUMN type ENUM('task_assigned', 'due_date_reminder', 'task_completed', 'workspace_invite', 'member_joined', 'project_invite') NOT NULL;"))
        print("Successfully updated notifications type enum to include 'project_invite'")

if __name__ == "__main__":
    asyncio.run(main())
