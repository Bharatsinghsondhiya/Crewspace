import asyncio
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = "mysql+aiomysql://root:bRjBVgOiQJSVjTBeINcRuvBvCpXVtTSF@kodama.proxy.rlwy.net:48190/railway"

async def main():
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        print("Changing column type to VARCHAR...")
        await conn.execute(sa.text("ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL;"))
        
        print("Updating existing user values from 'member' to 'user'...")
        await conn.execute(sa.text("UPDATE users SET role = 'user' WHERE role = 'member';"))
        
        print("Updating existing admin values from 'admin' to 'super_admin'...")
        await conn.execute(sa.text("UPDATE users SET role = 'super_admin' WHERE role = 'admin';"))
        
        print("Altering column to new ENUM('user', 'super_admin')...")
        await conn.execute(sa.text("ALTER TABLE users MODIFY COLUMN role ENUM('user', 'super_admin') NOT NULL DEFAULT 'user';"))
        
        print("Successfully updated users role enum and migrated existing values.")

if __name__ == "__main__":
    asyncio.run(main())
