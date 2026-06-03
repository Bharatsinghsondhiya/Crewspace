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

from fastapi import Request
from fastapi.responses import JSONResponse
import traceback
from datetime import datetime

@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        import os
        log_dir = r"e:\Access-Control-Hub\artifacts"
        os.makedirs(log_dir, exist_ok=True)
        log_file = os.path.join(log_dir, "error_trace.log")
        with open(log_file, "a") as f:
            f.write(f"--- Exception occurred at {datetime.now()} ---\n")
            f.write(f"Request: {request.method} {request.url}\n")
            traceback.print_exc(file=f)
            f.write("\n")
        
        response_content = {"detail": "Internal Server Error"}
        if os.getenv("DEBUG", "").lower() == "true":
            response_content["error"] = str(e)
            response_content["traceback"] = traceback.format_exc()
            
        return JSONResponse(
            status_code=500,
            content=response_content
        )

@app.exception_handler(Exception)
async def custom_exception_handler(request: Request, exc: Exception):
    import os
    log_dir = r"e:\Access-Control-Hub\artifacts"
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "error_trace.log")
    with open(log_file, "a") as f:
        f.write(f"--- Exception handler caught at {datetime.now()} ---\n")
        f.write(f"Request: {request.method} {request.url}\n")
        traceback.print_exception(type(exc), exc, exc.__traceback__, file=f)
        f.write("\n")
        
    response_content = {"detail": "Internal Server Error"}
    if os.getenv("DEBUG", "").lower() == "true":
        response_content["error"] = str(exc)
        response_content["traceback"] = traceback.format_exc()
        
    return JSONResponse(
        status_code=500,
        content=response_content
    )




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
