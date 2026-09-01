# app/services/ml_model.py
import joblib
import numpy as np
import shap
import os

MODEL_PATH = "models/xgb_model.pkl"
SCALER_PATH = "models/scaler.pkl"
ENCODERS_PATH = "models/label_encoders.pkl"

model = None
scaler = None
explainer = None
feature_names = None

def load_model():
    global model, scaler, explainer, feature_names
    try:
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        feature_names = ['age', 'gender', 'previous_grade', 'attendance_rate', 'assignments_completed', 
                         'test_scores_avg', 'days_absent_last_term', 'late_arrivals', 'disciplinary_incidents',
                         'parent_education_level', 'family_income_level', 'has_internet_access']
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
    
    feature_order = feature_names if feature_names else list(features_dict.keys())
    features_array = np.array([[features_dict.get(f, 0) for f in feature_order if f in features_dict]])
    features_scaled = scaler.transform(features_array)
    
    probability = model.predict_proba(features_scaled)[0][1]
    risk_score = round(probability * 100, 1)
    
    if risk_score < 40:
        risk_category = "Low"
    elif risk_score < 70:
        risk_category = "Medium"
    else:
        risk_category = "High"
    
    shap_values = explainer.shap_values(features_scaled)
    feature_importance = []
    for i, feature in enumerate(feature_order):
        if feature in features_dict:
            feature_importance.append({"feature": feature, "value": features_dict[feature], "impact": round(shap_values[0][i], 2)})
    feature_importance.sort(key=lambda x: abs(x["impact"]), reverse=True)
    top_factors = feature_importance[:3]
    
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

load_model()