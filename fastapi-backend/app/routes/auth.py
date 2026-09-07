# fastapi-backend/app/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
import secrets

from app.database import get_db, User, PasswordResetToken, VerificationToken
from app.auth import (
    authenticate_user, create_user, create_access_token, create_refresh_token,
    get_current_user, require_role,
    decode_token, verify_password, get_password_hash,
    update_login_attempts, is_account_locked,
    generate_2fa_secret, get_2fa_uri, generate_qr_code, verify_totp, generate_backup_codes,
    send_verification_email, send_password_reset_email,
    create_verification_token, create_reset_token,
    MAX_LOGIN_ATTEMPTS, LOCKOUT_MINUTES
)

# Create the router
router = APIRouter()

# ============================================
# SCHEMAS
# ============================================

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: str = "school"

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime]

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    requires_2fa: bool = False
    user: Optional[UserResponse] = None

class TokenRefresh(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

class VerifyEmailRequest(BaseModel):
    token: str

# ============================================
# ENDPOINTS
# ============================================

@router.post("/register", response_model=UserResponse)
async def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    # Check if username exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user = create_user(db, user_data.username, user_data.email, user_data.password, user_data.role)
    
    # Create verification token
    token = create_verification_token()
    expires_at = datetime.utcnow() + timedelta(hours=24)
    verification_token = VerificationToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at
    )
    db.add(verification_token)
    db.commit()
    
    # Send verification email
    send_verification_email(user.email, user.username, token)
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at,
        last_login=user.last_login
    )

@router.post("/login", response_model=LoginResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # Get user
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Check if account is locked
    if is_account_locked(user):
        remaining = (user.locked_until - datetime.utcnow()).seconds // 60
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Account locked. Try again in {remaining} minutes"
        )
    
    # Verify password
    if not verify_password(form_data.password, user.hashed_password):
        update_login_attempts(db, user, success=False)
        remaining_attempts = MAX_LOGIN_ATTEMPTS - user.login_attempts
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid credentials. {remaining_attempts} attempts remaining"
        )
    
    # Reset login attempts on success
    update_login_attempts(db, user, success=True)
    
    # Check if 2FA is required
    if user.two_factor_enabled:
        return LoginResponse(
            access_token="",
            refresh_token="",
            requires_2fa=True,
            user=None
        )
    
    # Generate tokens
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": user.username})
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        requires_2fa=False,
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            last_login=user.last_login
        )
    )

@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        return {"message": "If an account exists, a reset link has been sent"}
    
    token = create_reset_token()
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at
    )
    db.add(reset_token)
    db.commit()
    
    send_password_reset_email(user.email, user.username, token)
    
    return {"message": "Password reset email sent"}

@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    token_entry = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == request.token,
        PasswordResetToken.used_at == None
    ).first()
    
    if not token_entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    if token_entry.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired"
        )
    
    user = token_entry.user
    user.hashed_password = get_password_hash(request.new_password[:72])
    token_entry.used_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Password reset successfully"}

@router.post("/verify-email")
async def verify_email(
    request: VerifyEmailRequest,
    db: Session = Depends(get_db)
):
    token_entry = db.query(VerificationToken).filter(
        VerificationToken.token == request.token,
        VerificationToken.verified_at == None
    ).first()
    
    if not token_entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    if token_entry.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired"
        )
    
    user = token_entry.user
    user.is_verified = True
    token_entry.verified_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Email verified successfully"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
        last_login=current_user.last_login
    )

@router.post("/refresh")
async def refresh_access_token(
    refresh_data: TokenRefresh,
    db: Session = Depends(get_db)
):
    payload = decode_token(refresh_data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    username = payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_data.refresh_token,
        "token_type": "bearer"
    }

@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
):
    return {"message": "Successfully logged out"}