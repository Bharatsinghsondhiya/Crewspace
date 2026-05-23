import json
import redis.asyncio as redis
from typing import Optional, Any
from app.core.config import settings

# Global async Redis client
redis_client: Optional[redis.Redis] = None

async def init_redis():
    global redis_client
    redis_client = redis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True
    )

async def close_redis():
    global redis_client
    if redis_client:
        await redis_client.aclose()

async def get_cache(key: str) -> Optional[Any]:
    if not redis_client:
        return None
    try:
        cached_data = await redis_client.get(key)
        if cached_data:
            return json.loads(cached_data)
    except Exception as e:
        print(f"Redis get error: {e}")
    return None

async def set_cache(key: str, data: Any, expire_seconds: int = 300):
    if not redis_client:
        return
    try:
        await redis_client.set(key, json.dumps(data), ex=expire_seconds)
    except Exception as e:
        print(f"Redis set error: {e}")

async def delete_cache(key: str):
    if not redis_client:
        return
    await redis_client.delete(key)

async def delete_cache_pattern(pattern: str):
    if not redis_client:
        return
    try:
        # scan_iter is safer than keys() for production
        async for key in redis_client.scan_iter(match=pattern):
            await redis_client.delete(key)
    except Exception as e:
        print(f"Redis delete_pattern error: {e}")
