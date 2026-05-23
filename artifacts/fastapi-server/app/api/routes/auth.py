from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.database import get_db
from app.models import User
from app.schemas import LoginBody, LoginResponse, SignupBody, UserResponse, MessageResponse
from app.core import security
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/signup", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
async def signup(user_in: SignupBody, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = security.get_password_hash(user_in.password)
    from app.models import UserRole
    new_user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hashed_password,
        role=UserRole(user_in.role) if user_in.role else UserRole.member
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    access_token = security.create_access_token(new_user.id)
    refresh_token = security.create_refresh_token(new_user.id)
    
    return LoginResponse(
        user=new_user,
        access_token=access_token,
        refresh_token=refresh_token
    )

@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginBody, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.email == login_data.email))
    user = result.scalars().first()
    
    if not user or not security.verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
        
    access_token = security.create_access_token(user.id)
    refresh_token = security.create_refresh_token(user.id)
    
    return LoginResponse(
        user=user,
        access_token=access_token,
        refresh_token=refresh_token
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout", response_model=MessageResponse)
async def logout():
    return MessageResponse(message="Successfully logged out")

from pydantic import BaseModel

class ForgotPasswordBody(BaseModel):
    email: str

class ResetPasswordBody(BaseModel):
    token: str
    password: str

@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(body: ForgotPasswordBody):
    # Dummy implementation
    return MessageResponse(message="If the email exists, a reset link will be sent.")

@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(body: ResetPasswordBody):
    # Dummy implementation
    return MessageResponse(message="Password reset successfully")
