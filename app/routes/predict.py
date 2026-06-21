# app/routes/predict.py
from fastapi import APIRouter, HTTPException, status
from app.models import StudentFeatures, PredictionResponse, RiskCategory, Intervention
from app.services.ml_model import predict_dropout_risk

router = APIRouter()

@router.post("/predict", response_model=PredictionResponse, status_code=status.HTTP_200_OK)
async def predict_dropout_risk_endpoint(student: StudentFeatures):
    """
    Predict student dropout risk based on academic, behavioral, and demographic features.
    
    Returns:
    - risk_score: 0-100 score indicating dropout probability
    - risk_category: Low, Medium, or High
    - top_factors: Top 3 factors contributing to the risk score from SHAP
    - interventions: Recommended actions to reduce risk
    """
    try:
        # Convert Pydantic model to dict
        features_dict = student.dict()
        
        # Get prediction from ML model
        result = predict_dropout_risk(features_dict)
        
        # Map risk category to enum
        risk_category = RiskCategory(result["risk_category"])
        
        # Map interventions
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

@router.get("/health")
async def route_health():
    return {"route": "predict", "status": "healthy"}