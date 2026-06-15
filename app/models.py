# app/models.py
from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class RiskCategory(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class StudentFeatures(BaseModel):
    """Input features for dropout prediction"""
    
    # Demographics
    age: int = Field(..., ge=5, le=25, description="Student age")
    gender: int = Field(..., ge=0, le=1, description="0=Female, 1=Male")
    
    # Academic
    previous_grade: float = Field(..., ge=0, le=100, description="Previous year grade (0-100)")
    attendance_rate: float = Field(..., ge=0, le=100, description="Attendance percentage")
    assignments_completed: float = Field(..., ge=0, le=100, description="Percentage of assignments completed")
    test_scores_avg: float = Field(..., ge=0, le=100, description="Average test score")
    
    # Behavioral
    days_absent_last_term: int = Field(..., ge=0, description="Days absent last term")
    late_arrivals: int = Field(..., ge=0, description="Number of late arrivals")
    disciplinary_incidents: int = Field(..., ge=0, description="Number of disciplinary incidents")
    
    # Family/Socioeconomic
    parent_education_level: int = Field(..., ge=1, le=5, description="1=None, 2=Primary, 3=Secondary, 4=Diploma, 5=Degree")
    family_income_level: int = Field(..., ge=1, le=5, description="1=Very Low, 2=Low, 3=Medium, 4=High, 5=Very High")
    has_internet_access: int = Field(..., ge=0, le=1, description="0=No, 1=Yes")
    
    class Config:
        json_schema_extra = {
            "example": {
                "age": 15,
                "gender": 1,
                "previous_grade": 65.0,
                "attendance_rate": 78.0,
                "assignments_completed": 70.0,
                "test_scores_avg": 62.0,
                "days_absent_last_term": 12,
                "late_arrivals": 8,
                "disciplinary_incidents": 2,
                "parent_education_level": 2,
                "family_income_level": 2,
                "has_internet_access": 0
            }
        }

class Intervention(BaseModel):
    """Suggested intervention"""
    action: str
    priority: str  # High, Medium, Low
    reason: str

class PredictionResponse(BaseModel):
    """Output response from prediction endpoint"""
    risk_score: float = Field(..., description="Dropout risk score (0-100)")
    risk_category: RiskCategory
    top_factors: List[dict] = Field(..., description="Top 3 contributing factors from SHAP")
    interventions: List[Intervention]
    
    class Config:
        json_schema_extra = {
            "example": {
                "risk_score": 78.5,
                "risk_category": "High",
                "top_factors": [
                    {"feature": "attendance_rate", "value": 78.0, "impact": "+15.2"},
                    {"feature": "assignments_completed", "value": 70.0, "impact": "+12.8"},
                    {"feature": "days_absent_last_term", "value": 12, "impact": "+8.3"}
                ],
                "interventions": [
                    {"action": "Schedule parent-teacher meeting", "priority": "High", "reason": "Low attendance detected"},
                    {"action": "Provide homework support group", "priority": "Medium", "reason": "Missing assignments"},
                    {"action": "Contact family for attendance support", "priority": "High", "reason": "Excessive absences"}
                ]
            }
        }