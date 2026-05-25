import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from app.models import User

DATABASE_URL="mysql+aiomysql://root:bRjBVgOiQJSVjTBeINcRuvBvCpXVtTSF@kodama.proxy.rlwy.net:48190/railway"

async def test():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            result = await session.execute(select(User).filter(User.email == 'bharatsinghsondhiya4@gmail.com'))
            user = result.scalars().first()
            if user:
                print(f"User found: {user.email}, Role: {user.role}")
            else:
                print("User not found")
        except Exception as e:
            print(f"Error: {e}")

asyncio.run(test())
