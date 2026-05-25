from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.cache import init_redis, close_redis

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to Redis
    await init_redis()
    
    try:
        from app.db.database import engine
        import sqlalchemy as sa
        async with engine.begin() as conn:
            await conn.execute(sa.text("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'user', 'member') NOT NULL DEFAULT 'member';"))
            print("Successfully updated users role enum")
    except Exception as e:
        print(f"Error updating enum: {e}")
        
    yield
    # Shutdown: Disconnect from Redis safely
    await close_redis()

from fastapi.routing import APIRoute

def custom_generate_unique_id(route: APIRoute):
    return route.name

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
    generate_unique_id_function=custom_generate_unique_id
)

from app.api.api_router import api_router
app.include_router(api_router, prefix=settings.API_V1_STR)


# Configure CORS to allow frontend connections
import os
origins = [
    "http://localhost:5173", 
    "http://127.0.0.1:5173", 
    "http://localhost:3000"
]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to the FastAPI Backend"}

@app.get(f"{settings.API_V1_STR}/health")
async def health_check():
    return {"status": "ok"}
