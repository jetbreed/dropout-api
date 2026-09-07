# fastapi-backend/app/routes/train.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
import joblib
import os
from app.database import get_db, Student, User
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/train", tags=["training"])

@router.post("/model")
async def train_model(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Train XGBoost model using student data from database"""
    
    # Fetch all students with their features
    students = db.query(Student).all()
    
    if len(students) < 50:
        raise HTTPException(
            status_code=400,
            detail="Not enough students to train. Need at least 50."
        )
    
    # Prepare data
    data = []
    for student in students:
        # Calculate risk score based on features (for training target)
        risk = (
            (100 - student.attendance_rate) * 0.5 +
            (100 - student.assignments_completed) * 0.3 +
            (100 - student.test_scores_avg) * 0.2 +
            student.days_absent_last_term * 2 +
            student.disciplinary_incidents * 5 +
            (6 - student.parent_education_level) * 5 +
            (6 - student.family_income_level) * 3
        )
        is_dropout = 1 if risk > 70 else 0
        data.append({
            'age': student.age,
            'gender': student.gender,
            'previous_grade': student.previous_grade,
            'attendance_rate': student.attendance_rate,
            'assignments_completed': student.assignments_completed,
            'test_scores_avg': student.test_scores_avg,
            'days_absent_last_term': student.days_absent_last_term,
            'late_arrivals': student.late_arrivals,
            'disciplinary_incidents': student.disciplinary_incidents,
            'parent_education_level': student.parent_education_level,
            'family_income_level': student.family_income_level,
            'has_internet_access': student.has_internet_access,
            'is_dropout': is_dropout
        })
    
    df = pd.DataFrame(data)
    X = df.drop('is_dropout', axis=1)
    y = df['is_dropout']
    
    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train XGBoost
    xgb_model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        use_label_encoder=False,
        eval_metric='logloss'
    )
    xgb_model.fit(X_train_scaled, y_train)
    
    # Evaluate
    accuracy = xgb_model.score(X_test_scaled, y_test)
    
    # Save models
    os.makedirs('models', exist_ok=True)
    joblib.dump(xgb_model, 'models/xgb_model.pkl')
    joblib.dump(scaler, 'models/scaler.pkl')
    
    return {
        "message": "Model trained successfully",
        "accuracy": round(accuracy, 4),
        "samples": len(df),
        "dropout_rate": round(y.mean() * 100, 1)
    }