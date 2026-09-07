# fastapi-backend/app/models.py
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

# ============================================
# PREDICTION MODELS
# ============================================

class RiskCategory(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class StudentFeatures(BaseModel):
    age: int = Field(..., ge=5, le=25)
    gender: int = Field(..., ge=0, le=1)
    previous_grade: float = Field(..., ge=0, le=100)
    attendance_rate: float = Field(..., ge=0, le=100)
    assignments_completed: float = Field(..., ge=0, le=100)
    test_scores_avg: float = Field(..., ge=0, le=100)
    days_absent_last_term: int = Field(..., ge=0)
    late_arrivals: int = Field(..., ge=0)
    disciplinary_incidents: int = Field(..., ge=0)
    parent_education_level: int = Field(..., ge=1, le=5)
    family_income_level: int = Field(..., ge=1, le=5)
    has_internet_access: int = Field(..., ge=0, le=1)

class Intervention(BaseModel):
    action: str
    priority: str
    reason: str

class PredictionResponse(BaseModel):
    risk_score: float
    risk_category: RiskCategory
    top_factors: List[dict]
    interventions: List[Intervention]

# ============================================
# STUDENT MODELS
# ============================================

class StudentCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    date_of_birth: Optional[datetime] = None
    grade_level: Optional[int] = Field(None, ge=1, le=12)
    school_id: Optional[int] = None
    
    # Features
    age: int = Field(..., ge=5, le=25)
    gender: int = Field(..., ge=0, le=1)
    previous_grade: float = Field(..., ge=0, le=100)
    attendance_rate: float = Field(..., ge=0, le=100)
    assignments_completed: float = Field(..., ge=0, le=100)
    test_scores_avg: float = Field(..., ge=0, le=100)
    days_absent_last_term: int = Field(..., ge=0)
    late_arrivals: int = Field(..., ge=0)
    disciplinary_incidents: int = Field(..., ge=0)
    parent_education_level: int = Field(..., ge=1, le=5)
    family_income_level: int = Field(..., ge=1, le=5)
    has_internet_access: int = Field(..., ge=0, le=1)

class StudentUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    email: Optional[EmailStr] = None
    grade_level: Optional[int] = Field(None, ge=1, le=12)
    attendance_rate: Optional[float] = Field(None, ge=0, le=100)
    assignments_completed: Optional[float] = Field(None, ge=0, le=100)
    test_scores_avg: Optional[float] = Field(None, ge=0, le=100)

# StudentResponse - remove student_id
class StudentResponse(BaseModel):
    id: int
    user_id: int
    first_name: str
    last_name: str
    email: str
    grade_level: Optional[int] = None
    age: int
    gender: int
    attendance_rate: float
    assignments_completed: float
    test_scores_avg: float
    days_absent_last_term: int
    risk_score: Optional[float] = None
    risk_category: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class StudentListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    students: List[StudentResponse]

# ============================================
# SCHOOL MODELS
# ============================================

class SchoolCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    location: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    subscription_tier: Optional[str] = "free"

class SchoolResponse(BaseModel):
    id: int
    user_id: int
    name: str
    location: Optional[str]
    contact_email: Optional[str]
    contact_phone: Optional[str]
    subscription_tier: str
    created_at: datetime

# ============================================
# USER / AUTH MODELS
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
# ANALYTICS MODELS
# ============================================

class DashboardStats(BaseModel):
    total_students: int
    total_predictions: int
    risk_distribution: dict
    grade_distribution: List[dict]
    recent_predictions: int
    average_risk_score: float

class RiskTrendResponse(BaseModel):
    labels: List[str]
    avg_risk: List[float]
    counts: List[int]