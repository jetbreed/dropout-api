# app/services/ml_model.py
import joblib
import numpy as np
import pandas as pd
import shap
import os

# Paths to model files
MODEL_PATH = "models/xgb_model.pkl"
SCALER_PATH = "models/scaler.pkl"
ENCODERS_PATH = "models/label_encoders.pkl"

# Global variables for model and explainer
model = None
scaler = None
label_encoders = None
explainer = None
feature_names = None

def load_model():
    """Load the trained XGBoost model and related artifacts"""
    global model, scaler, label_encoders, explainer, feature_names
    
    try:
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        label_encoders = joblib.load(ENCODERS_PATH)
        
        # Get feature names from scaler
        if hasattr(scaler, 'feature_names_in_'):
            feature_names = scaler.feature_names_in_
        else:
            # Default feature names based on StudentFeatures model
            feature_names = ['age', 'gender', 'previous_grade', 'attendance_rate', 
                           'assignments_completed', 'test_scores_avg', 'days_absent_last_term',
                           'late_arrivals', 'disciplinary_incidents', 'parent_education_level',
                           'family_income_level', 'has_internet_access']
        
        # Create SHAP explainer
        explainer = shap.TreeExplainer(model)
        
        print("Model loaded successfully")
        return True
    except Exception as e:
        print(f"Error loading model: {e}")
        return False

def predict_dropout_risk(features_dict: dict) -> dict:
    """
    Predict dropout risk for a single student
    
    Args:
        features_dict: Dictionary of student features
    
    Returns:
        dict with risk_score, risk_category, top_factors, interventions
    """
    if model is None:
        load_model()
    
    # Extract features in correct order
    feature_order = feature_names if feature_names else list(features_dict.keys())
    features_array = np.array([[features_dict[f] for f in feature_order if f in features_dict]])
    
    # Scale features
    features_scaled = scaler.transform(features_array)
    
    # Get prediction probability
    probability = model.predict_proba(features_scaled)[0][1]
    risk_score = round(probability * 100, 1)
    
    # Determine risk category
    if risk_score < 40:
        risk_category = "Low"
    elif risk_score < 70:
        risk_category = "Medium"
    else:
        risk_category = "High"
    
    # Get SHAP values for this prediction
    shap_values = explainer.shap_values(features_scaled)
    
    # Create feature importance list from SHAP
    feature_importance = []
    for i, feature in enumerate(feature_order):
        if feature in features_dict:
            feature_importance.append({
                "feature": feature,
                "value": features_dict[feature],
                "impact": round(shap_values[0][i], 2)
            })
    
    # Sort by absolute impact and get top 3
    feature_importance.sort(key=lambda x: abs(x["impact"]), reverse=True)
    top_factors = feature_importance[:3]
    
    # Generate interventions based on top factors
    interventions = []
    
    for factor in top_factors:
        feature = factor["feature"]
        value = factor["value"]
        
        if feature == "attendance_rate" and value < 80:
            interventions.append({
                "action": "Schedule parent-teacher meeting",
                "priority": "High",
                "reason": f"Attendance rate is {value}% (below 80% threshold)"
            })
        elif feature == "assignments_completed" and value < 75:
            interventions.append({
                "action": "Provide homework support group",
                "priority": "Medium",
                "reason": f"Only {value}% of assignments completed"
            })
        elif feature == "days_absent_last_term" and value > 10:
            interventions.append({
                "action": "Contact family for attendance support",
                "priority": "High",
                "reason": f"{value} absences in last term"
            })
        elif feature == "test_scores_avg" and value < 60:
            interventions.append({
                "action": "Provide tutoring in core subjects",
                "priority": "High",
                "reason": f"Test scores average {value}% (below 60% threshold)"
            })
        elif feature == "previous_grade" and value < 60:
            interventions.append({
                "action": "Review previous year performance with student",
                "priority": "Medium",
                "reason": f"Previous grade was {value}%"
            })
        elif feature == "disciplinary_incidents" and value > 0:
            interventions.append({
                "action": "Schedule counseling session",
                "priority": "Medium",
                "reason": f"{value} disciplinary incident(s) reported"
            })
    
    # Add default intervention if none were generated
    if not interventions:
        interventions.append({
            "action": "Continue current support and monitoring",
            "priority": "Low",
            "reason": "No immediate risk factors detected"
        })
    
    return {
        "risk_score": risk_score,
        "risk_category": risk_category,
        "top_factors": top_factors,
        "interventions": interventions
    }

# Load model on module import
load_model()