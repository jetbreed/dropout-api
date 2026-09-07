# fastapi-backend/app/routes/predict.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import joblib
import numpy as np
import shap
import os

from app.models import StudentFeatures, PredictionResponse, RiskCategory, Intervention
from app.database import get_db, Prediction as PredictionDB
from app.auth import get_current_user, User

router = APIRouter(prefix="/predict", tags=["predictions"])

MODEL_PATH = "models/xgb_model.pkl"
SCALER_PATH = "models/scaler.pkl"

model = None
scaler = None
explainer = None
feature_names = ['age', 'gender', 'previous_grade', 'attendance_rate', 'assignments_completed', 
                 'test_scores_avg', 'days_absent_last_term', 'late_arrivals', 'disciplinary_incidents',
                 'parent_education_level', 'family_income_level', 'has_internet_access']

def load_model():
    global model, scaler, explainer
    try:
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        explainer = shap.TreeExplainer(model)
        print("✅ Model loaded successfully")
        return True
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return False

load_model()

@router.post("/", response_model=PredictionResponse)
async def predict(
    student: StudentFeatures,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        features_dict = student.dict()
        features_array = np.array([[features_dict.get(f, 0) for f in feature_names]], dtype=np.float64)
        features_scaled = scaler.transform(features_array)
        
        probability = model.predict_proba(features_scaled)[0][1]
        risk_score = float(round(probability * 100, 1))
        
        if risk_score < 40:
            risk_category = "Low"
        elif risk_score < 70:
            risk_category = "Medium"
        else:
            risk_category = "High"
        
        shap_values = explainer.shap_values(features_scaled)
        feature_importance = []
        for i, feature in enumerate(feature_names):
            feature_importance.append({
                "feature": feature,
                "value": float(features_dict.get(feature, 0)),
                "impact": float(round(shap_values[0][i], 2))
            })
        feature_importance.sort(key=lambda x: abs(x["impact"]), reverse=True)
        top_factors = feature_importance[:3]
        
        interventions = []
        for factor in top_factors:
            feature = factor["feature"]
            value = float(factor["value"])
            if feature == "attendance_rate" and value < 80:
                interventions.append({"action": "Schedule parent-teacher meeting", "priority": "High", "reason": f"Attendance rate is {value}% (below 80% threshold)"})
            elif feature == "assignments_completed" and value < 75:
                interventions.append({"action": "Provide homework support group", "priority": "Medium", "reason": f"Only {value}% of assignments completed"})
            elif feature == "days_absent_last_term" and value > 10:
                interventions.append({"action": "Contact family for attendance support", "priority": "High", "reason": f"{value} absences in last term"})
        
        if not interventions:
            interventions.append({"action": "Continue current support", "priority": "Low", "reason": "No immediate risk factors detected"})
        
        # Save to database
        prediction_db = PredictionDB(
            user_id=current_user.id,
            student_data=student.dict(),
            risk_score=risk_score,
            risk_category=risk_category,
            top_factors=top_factors,
            interventions=interventions
        )
        db.add(prediction_db)
        db.commit()
        db.refresh(prediction_db)
        
        return PredictionResponse(
            risk_score=risk_score,
            risk_category=RiskCategory(risk_category),
            top_factors=top_factors,
            interventions=[Intervention(**inv) for inv in interventions]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_history(
    limit: int = 100,
    skip: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    predictions = db.query(PredictionDB).filter(
        PredictionDB.user_id == current_user.id
    ).order_by(PredictionDB.created_at.desc()).offset(skip).limit(limit).all()
    
    total = db.query(PredictionDB).filter(
        PredictionDB.user_id == current_user.id
    ).count()
    
    return {
        "total": total,
        "predictions": [
            {
                "id": p.id,
                "student_data": p.student_data,
                "risk_score": p.risk_score,
                "risk_category": p.risk_category,
                "top_factors": p.top_factors,
                "interventions": p.interventions,
                "created_at": p.created_at
            }
            for p in predictions
        ]
    }

@router.delete("/history/{prediction_id}")
async def delete_prediction(
    prediction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prediction = db.query(PredictionDB).filter(
        PredictionDB.id == prediction_id,
        PredictionDB.user_id == current_user.id
    ).first()
    
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    db.delete(prediction)
    db.commit()
    return {"message": "Prediction deleted successfully"}

@router.get("/stats")
async def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    predictions = db.query(PredictionDB).filter(
        PredictionDB.user_id == current_user.id
    ).all()
    
    if not predictions:
        return {
            "total": 0,
            "average_risk": 0,
            "risk_distribution": {"Low": 0, "Medium": 0, "High": 0},
            "top_risk_factors": []
        }
    
    avg_risk = sum(p.risk_score for p in predictions) / len(predictions)
    risk_counts = {"Low": 0, "Medium": 0, "High": 0}
    for p in predictions:
        risk_counts[p.risk_category] += 1
    
    factors = {}
    for p in predictions:
        for factor in p.top_factors:
            fname = factor["feature"]
            if fname not in factors:
                factors[fname] = 0
            factors[fname] += 1
    
    top_factors = sorted(factors.items(), key=lambda x: x[1], reverse=True)[:5]
    
    return {
        "total": len(predictions),
        "average_risk": round(avg_risk, 1),
        "risk_distribution": risk_counts,
        "top_risk_factors": [{"feature": f, "count": c} for f, c in top_factors]
    }