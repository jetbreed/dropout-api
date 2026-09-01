# app/routes/predict.py
from fastapi import APIRouter, HTTPException, status
from app.models import StudentFeatures, PredictionResponse, RiskCategory, Intervention
import joblib
import numpy as np
import shap
import os

router = APIRouter()

# Load model and scaler
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

def predict_dropout_risk(features_dict: dict) -> dict:
    global model, scaler, explainer, feature_names
    if model is None:
        load_model()
    
    # Create feature array in the correct order
    features_array = np.array([[features_dict.get(f, 0) for f in feature_names]])
    features_scaled = scaler.transform(features_array)
    
    # Get prediction
    probability = model.predict_proba(features_scaled)[0][1]
    risk_score = round(probability * 100, 1)
    
    # Determine category
    if risk_score < 40:
        risk_category = "Low"
    elif risk_score < 70:
        risk_category = "Medium"
    else:
        risk_category = "High"
    
    # SHAP explanations
    shap_values = explainer.shap_values(features_scaled)
    feature_importance = []
    for i, feature in enumerate(feature_names):
        feature_importance.append({
            "feature": feature,
            "value": features_dict.get(feature, 0),
            "impact": round(shap_values[0][i], 2)
        })
    feature_importance.sort(key=lambda x: abs(x["impact"]), reverse=True)
    top_factors = feature_importance[:3]
    
    # Generate interventions
    interventions = []
    for factor in top_factors:
        feature = factor["feature"]
        value = factor["value"]
        if feature == "attendance_rate" and value < 80:
            interventions.append({"action": "Schedule parent-teacher meeting", "priority": "High", "reason": f"Attendance rate is {value}% (below 80% threshold)"})
        elif feature == "assignments_completed" and value < 75:
            interventions.append({"action": "Provide homework support group", "priority": "Medium", "reason": f"Only {value}% of assignments completed"})
        elif feature == "days_absent_last_term" and value > 10:
            interventions.append({"action": "Contact family for attendance support", "priority": "High", "reason": f"{value} absences in last term"})
    if not interventions:
        interventions.append({"action": "Continue current support", "priority": "Low", "reason": "No immediate risk factors detected"})
    
    return {
        "risk_score": risk_score,
        "risk_category": risk_category,
        "top_factors": top_factors,
        "interventions": interventions
    }

# Load model on startup
load_model()

@router.post("/predict", response_model=PredictionResponse, status_code=status.HTTP_200_OK)
async def predict_dropout_risk_endpoint(student: StudentFeatures):
    try:
        result = predict_dropout_risk(student.dict())
        risk_category = RiskCategory(result["risk_category"])
        interventions = [
            Intervention(
                action=inv["action"],
                priority=inv["priority"],
                reason=inv["reason"]
            )
            for inv in result["interventions"]
        ]
        return PredictionResponse(
            risk_score=result["risk_score"],
            risk_category=risk_category,
            top_factors=result["top_factors"],
            interventions=interventions
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Prediction failed: {str(e)}")

@router.get("/health")
async def route_health():
    return {"route": "predict", "status": "healthy"}