# fastapi-backend/app/services/ml_model.py
import joblib
import numpy as np
import shap
import os

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

# fastapi-backend/app/services/ml_model.py - Ensure this is correct

def predict_dropout_risk(features_dict: dict) -> dict:
    global model, scaler, explainer, feature_names
    if model is None:
        load_model()
    
    # Create feature array in the correct order
    features_array = np.array([[features_dict.get(f, 0) for f in feature_names]], dtype=np.float64)
    features_scaled = scaler.transform(features_array)
    
    # Get prediction
    probability = model.predict_proba(features_scaled)[0][1]
    risk_score = float(round(probability * 100, 1))
    
    # Determine category
    if risk_score < 40:
        risk_category = "Low"
    elif risk_score < 70:
        risk_category = "Medium"
    else:
        risk_category = "High"
    
    # SHAP explanations - convert numpy to Python types
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
        elif feature == "test_scores_avg" and value < 60:
            interventions.append({"action": "Provide tutoring in core subjects", "priority": "High", "reason": f"Test scores average {value}% (below 60% threshold)"})
        elif feature == "previous_grade" and value < 60:
            interventions.append({"action": "Review previous year performance with student", "priority": "Medium", "reason": f"Previous grade was {value}%"})
        elif feature == "disciplinary_incidents" and value > 0:
            interventions.append({"action": "Schedule counseling session", "priority": "Medium", "reason": f"{value} disciplinary incident(s) reported"})
    
    if not interventions:
        interventions.append({"action": "Continue current support", "priority": "Low", "reason": "No immediate risk factors detected"})
    
    return {
        "risk_score": risk_score,
        "risk_category": risk_category,
        "top_factors": [
            {
                "feature": f["feature"],
                "value": float(f["value"]),
                "impact": float(f["impact"])
            }
            for f in top_factors
        ],
        "interventions": [
            {
                "action": str(i["action"]),
                "priority": str(i["priority"]),
                "reason": str(i["reason"])
            }
            for i in interventions
        ]
    }
    
# Load model on module import
load_model()