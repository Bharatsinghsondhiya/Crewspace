import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import sys
sys.path.append("e:/Access-Control-Hub/artifacts/fastapi-server")
from app.core.config import settings

async def test_db():
    try:
        engine = create_async_engine(settings.DATABASE_URL, echo=False)
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        print("DB_SUCCESS")
    except Exception as e:
        print(f"DB_ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(test_db())
