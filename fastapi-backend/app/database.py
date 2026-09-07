# fastapi-backend/app/database.py
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON, Boolean, ForeignKey, Text, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@postgres:5432/dropout_db")

# Retry connection to PostgreSQL
max_retries = 10
retry_delay = 3

for attempt in range(max_retries):
    try:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info(f"✅ Connected to PostgreSQL on attempt {attempt + 1}")
        break
    except Exception as e:
        logger.warning(f"⚠️ Connection attempt {attempt + 1} failed: {e}")
        if attempt < max_retries - 1:
            time.sleep(retry_delay)
        else:
            logger.error("❌ Failed to connect to PostgreSQL after multiple attempts")
            raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ============================================
# USERS TABLE
# ============================================

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="school")  # admin, school, teacher, student
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 2FA
    two_factor_secret = Column(String(255), nullable=True)
    two_factor_enabled = Column(Boolean, default=False)
    backup_codes = Column(JSON, nullable=True)
    
    # Relationships
    students = relationship("Student", back_populates="user", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="user", cascade="all, delete-orphan")
    reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")
    verification_tokens = relationship("VerificationToken", back_populates="user", cascade="all, delete-orphan")
    schools = relationship("School", back_populates="user")

# ============================================
# SCHOOLS TABLE
# ============================================

class School(Base):
    __tablename__ = "schools"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    location = Column(String(200), nullable=True)
    contact_email = Column(String(100), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    subscription_tier = Column(String(20), default="free")  # free, basic, premium
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="schools")
    students = relationship("Student", back_populates="school", cascade="all, delete-orphan")

# ============================================
# STUDENTS TABLE
# ============================================

# fastapi-backend/app/database.py - Student model (updated)
class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=True)
    
    # Personal Information (removed student_id)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    date_of_birth = Column(DateTime, nullable=True)
    grade_level = Column(Integer, nullable=True)
    
    # Academic Features
    age = Column(Integer, nullable=False)
    gender = Column(Integer, nullable=False)
    previous_grade = Column(Float, nullable=False)
    attendance_rate = Column(Float, nullable=False)
    assignments_completed = Column(Float, nullable=False)
    test_scores_avg = Column(Float, nullable=False)
    days_absent_last_term = Column(Integer, nullable=False)
    late_arrivals = Column(Integer, nullable=False)
    disciplinary_incidents = Column(Integer, nullable=False)
    
    # Socioeconomic Features
    parent_education_level = Column(Integer, nullable=False)
    family_income_level = Column(Integer, nullable=False)
    has_internet_access = Column(Integer, nullable=False)
    
    # Metadata
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="students")
    school = relationship("School", back_populates="students")
    predictions = relationship("Prediction", back_populates="student", cascade="all, delete-orphan")

# ============================================
# PREDICTIONS TABLE
# ============================================

class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    
    # Features used
    student_data = Column(JSON, nullable=False)
    
    # Prediction results
    risk_score = Column(Float, nullable=False)
    risk_category = Column(String(20), nullable=False)
    top_factors = Column(JSON, nullable=False)
    interventions = Column(JSON, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="predictions")
    student = relationship("Student", back_populates="predictions")

# ============================================
# TOKEN TABLES
# ============================================

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="reset_tokens")

class VerificationToken(Base):
    __tablename__ = "verification_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="verification_tokens")

# ============================================
# DEPENDENCIES
# ============================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create all tables
Base.metadata.create_all(bind=engine)
logger.info("✅ Database tables created/verified")