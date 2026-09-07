# fastapi-backend/app/routes/analytics.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract
from datetime import datetime, timedelta
from typing import List, Optional
from app.database import get_db, Student, Prediction, User, School
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/analytics", tags=["analytics"])

# ============================================
# DASHBOARD STATISTICS
# ============================================

@router.get("/dashboard-stats")
async def get_dashboard_stats(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Get overall statistics for admin dashboard"""
    
    # Total students
    total_students = db.query(Student).count()
    
    # Active students
    active_students = db.query(Student).filter(Student.is_active == True).count()
    
    # Total predictions
    total_predictions = db.query(Prediction).count()
    
    # Schools count
    total_schools = db.query(School).count()
    
    # Students by risk category (latest prediction)
    risk_counts = {"Low": 0, "Medium": 0, "High": 0}
    
    # Get all students and their latest predictions
    students = db.query(Student).all()
    for student in students:
        latest_pred = db.query(Prediction).filter(
            Prediction.student_id == student.id
        ).order_by(Prediction.created_at.desc()).first()
        if latest_pred:
            if latest_pred.risk_category in risk_counts:
                risk_counts[latest_pred.risk_category] += 1
    
    # Students by grade level
    grade_counts = db.query(
        Student.grade_level, 
        func.count().label("count")
    ).group_by(Student.grade_level).all()
    
    # Recent predictions (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_predictions = db.query(Prediction).filter(
        Prediction.created_at >= seven_days_ago
    ).count()
    
    # Average risk score
    avg_risk_result = db.query(func.avg(Prediction.risk_score)).scalar()
    avg_risk = round(avg_risk_result, 1) if avg_risk_result else 0
    
    # Predictions by day (last 7 days)
    daily_predictions = []
    for i in range(7):
        day = datetime.utcnow() - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = db.query(Prediction).filter(
            Prediction.created_at >= day_start,
            Prediction.created_at < day_end
        ).count()
        daily_predictions.append({
            "date": day.strftime("%Y-%m-%d"),
            "count": count
        })
    
    return {
        "total_students": total_students,
        "active_students": active_students,
        "total_predictions": total_predictions,
        "total_schools": total_schools,
        "risk_distribution": risk_counts,
        "grade_distribution": [{"grade": g, "count": c} for g, c in grade_counts if g is not None],
        "recent_predictions": recent_predictions,
        "average_risk_score": avg_risk,
        "daily_predictions": daily_predictions
    }

# ============================================
# RISK TREND OVER TIME
# ============================================

@router.get("/risk-trend")
async def get_risk_trend(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Get risk trend over time for charts"""
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Group predictions by date
    predictions = db.query(
        func.date(Prediction.created_at).label("date"),
        func.avg(Prediction.risk_score).label("avg_risk"),
        func.count(Prediction.id).label("count")
    ).filter(
        Prediction.created_at >= start_date
    ).group_by(
        func.date(Prediction.created_at)
    ).order_by(
        func.date(Prediction.created_at)
    ).all()
    
    # Fill in missing dates
    date_range = []
    avg_risks = []
    counts = []
    
    current_date = start_date.date()
    end_date = datetime.utcnow().date()
    
    # Create a dict for fast lookup
    pred_dict = {p[0]: p for p in predictions}
    
    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        date_range.append(date_str)
        if current_date in pred_dict:
            avg_risks.append(round(pred_dict[current_date][1], 1))
            counts.append(pred_dict[current_date][2])
        else:
            avg_risks.append(0)
            counts.append(0)
        current_date += timedelta(days=1)
    
    return {
        "labels": date_range,
        "avg_risk": avg_risks,
        "counts": counts
    }

# ============================================
# RISK DISTRIBUTION BY DEMOGRAPHICS
# ============================================

@router.get("/risk-by-demographics")
async def get_risk_by_demographics(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Get risk distribution by gender and grade level"""
    
    # Risk by gender
    gender_risk = db.query(
        Student.gender,
        func.avg(Prediction.risk_score).label("avg_risk"),
        func.count(Prediction.id).label("count")
    ).join(
        Prediction, Prediction.student_id == Student.id
    ).group_by(
        Student.gender
    ).all()
    
    # Risk by grade level
    grade_risk = db.query(
        Student.grade_level,
        func.avg(Prediction.risk_score).label("avg_risk"),
        func.count(Prediction.id).label("count")
    ).join(
        Prediction, Prediction.student_id == Student.id
    ).group_by(
        Student.grade_level
    ).order_by(
        Student.grade_level
    ).all()
    
    return {
        "by_gender": [
            {
                "gender": "Female" if r[0] == 0 else "Male",
                "avg_risk": round(r[1], 1) if r[1] else 0,
                "count": r[2]
            }
            for r in gender_risk
        ],
        "by_grade": [
            {
                "grade": r[0],
                "avg_risk": round(r[1], 1) if r[1] else 0,
                "count": r[2]
            }
            for r in grade_risk
        ]
    }

# ============================================
# TOP RISK FACTORS
# ============================================

@router.get("/top-risk-factors")
async def get_top_risk_factors(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Get most common risk factors from predictions"""
    
    # Query all predictions and aggregate top factors
    predictions = db.query(Prediction).all()
    
    factor_counts = {}
    factor_impacts = {}
    
    for pred in predictions:
        if pred.top_factors:
            for factor in pred.top_factors:
                feature = factor.get("feature")
                impact = factor.get("impact", 0)
                if feature:
                    factor_counts[feature] = factor_counts.get(feature, 0) + 1
                    factor_impacts[feature] = factor_impacts.get(feature, 0) + impact
    
    # Sort by frequency
    sorted_factors = sorted(
        factor_counts.items(),
        key=lambda x: x[1],
        reverse=True
    )[:limit]
    
    return [
        {
            "feature": f,
            "frequency": c,
            "avg_impact": round(factor_impacts.get(f, 0) / c, 2) if c > 0 else 0
        }
        for f, c in sorted_factors
    ]