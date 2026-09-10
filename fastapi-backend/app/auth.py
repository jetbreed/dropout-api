# fastapi-backend/app/auth.py
from datetime import datetime, timedelta
from typing import Optional, List
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db, User, PasswordResetToken, VerificationToken
import bcrypt
import secrets
import pyotp
import qrcode
from io import BytesIO
import base64
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ============================================
# CONFIGURATION
# ============================================

SECRET_KEY = os.getenv("JWT_SECRET", "your-super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7
RESET_TOKEN_EXPIRE_MINUTES = 15
VERIFICATION_TOKEN_EXPIRE_HOURS = 24
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

# Email configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@dropout-api.com")
APP_NAME = "Dropout API"
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# ============================================
# PASSWORD FUNCTIONS (Direct bcrypt)
# ============================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password[:72].encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    password_bytes = password[:72].encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

# ============================================
# JWT FUNCTIONS
# ============================================

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

def create_verification_token() -> str:
    return secrets.token_urlsafe(32)

def create_reset_token() -> str:
    return secrets.token_urlsafe(32)

# ============================================
# USER FUNCTIONS
# ============================================

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def create_user(db: Session, username: str, email: str, password: str, role: str = "school"):
    hashed_password = get_password_hash(password)
    db_user = User(
        username=username,
        email=email,
        hashed_password=hashed_password,
        role=role,
        is_active=True,
        is_verified=False,
        login_attempts=0
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_login_attempts(db: Session, user: User, success: bool = False):
    if success:
        user.login_attempts = 0
        user.locked_until = None
        user.last_login = datetime.utcnow()
    else:
        user.login_attempts += 1
        if user.login_attempts >= MAX_LOGIN_ATTEMPTS:
            user.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_MINUTES)
    db.commit()

def is_account_locked(user: User) -> bool:
    if user.locked_until and user.locked_until > datetime.utcnow():
        return True
    return False

# ============================================
# 2FA FUNCTIONS
# ============================================

def generate_2fa_secret() -> str:
    return pyotp.random_base32()

def get_2fa_uri(secret: str, username: str) -> str:
    return pyotp.totp.TOTP(secret).provisioning_uri(username, issuer_name=APP_NAME)

def generate_qr_code(secret: str, username: str) -> str:
    uri = get_2fa_uri(secret, username)
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode()

def verify_totp(secret: str, token: str) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(token)

def generate_backup_codes() -> List[str]:
    return [secrets.token_hex(4) for _ in range(10)]

# ============================================
# EMAIL FUNCTIONS
# ============================================

def send_email(to_email: str, subject: str, body: str, html_body: Optional[str] = None):
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"⚠️ Email not configured. Would have sent to {to_email}: {subject}")
        return
    
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = FROM_EMAIL
        msg["To"] = to_email
        
        part1 = MIMEText(body, "plain")
        msg.attach(part1)
        
        if html_body:
            part2 = MIMEText(html_body, "html")
            msg.attach(part2)
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())
        print(f"✅ Email sent to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")

def send_verification_email(email: str, username: str, token: str):
    verification_url = f"{FRONTEND_URL}/verify-email?token={token}"
    subject = f"Verify Your {APP_NAME} Account"
    body = f"""
Hello {username},

Welcome to {APP_NAME}! Please verify your email address by clicking the link below:

{verification_url}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.

Best regards,
The {APP_NAME} Team
"""
    send_email(email, subject, body)

def send_password_reset_email(email: str, username: str, token: str):
    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
    subject = f"Reset Your {APP_NAME} Password"
    body = f"""
Hello {username},

We received a request to reset your password. Click the link below to set a new password:

{reset_url}

This link will expire in 15 minutes.

If you didn't request a password reset, please ignore this email.

Best regards,
The {APP_NAME} Team
"""
    send_email(email, subject, body)

# ============================================
# DEPENDENCIES
# ============================================

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = get_user_by_username(db, username)
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")
    
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    return current_user

def require_role(required_role: str):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role != required_role and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{required_role}' required"
            )
        return current_user
    return role_checker