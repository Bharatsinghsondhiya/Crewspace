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
    new_user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hashed_password,
        is_super_admin=False
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

import secrets
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, EmailStr, Field
from app.core.config import settings
from app.core.mailer import send_email

class ForgotPasswordBody(BaseModel):
    email: EmailStr

class ResetPasswordBody(BaseModel):
    token: str
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")

@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(body: ForgotPasswordBody, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.email == body.email))
    user = result.scalars().first()
    
    if not user:
        # Prevent Email Enumeration / User Enumeration vulnerability
        return MessageResponse(message="If the email exists, a reset link will be sent.")
        
    # Generate secure random token and store only its hash
    raw_token = secrets.token_urlsafe(32)
    import hashlib
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    user.reset_token = token_hash
    user.reset_token_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    await db.commit()
    
    # Construct reset link with the raw (unhashed) token
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
    
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #6366f1; text-align: center;">Password Reset Request</h2>
        <p>Hello {user.name},</p>
        <p>We received a request to reset your password for your Access Control Hub account.</p>
        <p>Click the button below to reset your password. This link is valid for 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_link}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 0.875rem;">If the button above doesn't work, copy and paste the following URL into your browser:</p>
        <p style="color: #3b82f6; font-size: 0.875rem; word-break: break-all;">{reset_link}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 0.75rem;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    </div>
    """
    
    # Dispatch email asynchronously using our nodemailer helper
    email_sent = await send_email(user.email, "Reset your Access Control Hub Password", html_content)
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send reset email. Please check backend server logs for the error details."
        )
    
    return MessageResponse(message="If the email exists, a reset link will be sent.")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(body: ResetPasswordBody, db: AsyncSession = Depends(get_db)):
    import hashlib, re
    
    # Validate password strength: min 8 chars, at least one uppercase, one digit or special char
    pwd = body.password
    if not re.search(r"[A-Z]", pwd):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
    if not re.search(r"[0-9!@#$%^&*()_+\-=\[\]{};':,./<>?]", pwd):
        raise HTTPException(status_code=400, detail="Password must contain at least one digit or special character")
    
    # Hash the incoming raw token before lookup
    token_hash = hashlib.sha256(body.token.encode()).hexdigest()
    result = await db.execute(select(User).filter(User.reset_token == token_hash))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
        
    # Check expiry
    current_time = datetime.now(timezone.utc)
    expires_at = user.reset_token_expires_at
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if not expires_at or expires_at < current_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
        
    # Hash and save the new password
    user.password_hash = security.get_password_hash(body.password)
    user.reset_token = None
    user.reset_token_expires_at = None
    # Invalidate refresh token so old sessions cannot be reused after password change
    user.refresh_token = None
    
    await db.commit()
    
    return MessageResponse(message="Password reset successfully")


@router.get("/db-test")
async def db_test(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Restrict to admin users only to prevent sensitive info leakage
    if not current_user.is_super_admin:
        raise HTTPException(status_code=403, detail="Forbidden")
    try:
        from sqlalchemy import text
        result = await db.execute(text("SELECT 1"))
        val = result.scalar()
        
        from app.models import User
        user_result = await db.execute(select(User).limit(1))
        first_user = user_result.scalars().first()
        user_data = f"User found: {first_user.name} ({first_user.email})" if first_user else "No users in DB"
        
        return {
            "status": "success",
            "test_query": val,
            "user_query": user_data
        }
    except Exception as e:
        return {
            "status": "error",
            "error": "Database query failed. Check server logs."
        }



