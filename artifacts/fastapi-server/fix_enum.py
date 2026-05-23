import asyncio
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import create_async_engine

async def main():
    engine = create_async_engine("mysql+aiomysql://root:bRjBVgOiQJSVjTBeINcRuvBvCpXVtTSF@kodama.proxy.rlwy.net:48190/railway")
    async with engine.begin() as conn:
        await conn.execute(sa.text("ALTER TABLE workspace_members MODIFY COLUMN role ENUM('owner', 'manager', 'member', 'viewer') NOT NULL DEFAULT 'member';"))
        print("Successfully updated workspace_members role enum")

asyncio.run(main())
