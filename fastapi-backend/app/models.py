# fastapi-backend/app/models.py
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime
from enum import Enum

# ============================================
# REQUEST MODELS
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
# USER MODELS
# ============================================

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: Optional[str] = "school"

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    created_at: datetime

# ============================================
# SCHOOL MODELS
# ============================================

class SchoolCreate(BaseModel):
    name: str
    location: Optional[str] = None
    contact_email: Optional[EmailStr] = None

class SchoolResponse(BaseModel):
    id: int
    name: str
    location: Optional[str]
    contact_email: Optional[str]
    subscription_tier: str
    created_at: datetime

# ============================================
# HISTORY MODELS
# ============================================

class PredictionHistoryResponse(BaseModel):
    id: int
    student_data: dict
    risk_score: float
    risk_category: str
    top_factors: List[dict]
    interventions: List[dict]
    created_at: datetime

class PredictionHistoryList(BaseModel):
    total: int
    predictions: List[PredictionHistoryResponse]