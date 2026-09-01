# fastapi-backend/app/routes/predict.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import joblib
import numpy as np
import shap
import os

from app.models import (
    StudentFeatures, PredictionResponse, RiskCategory, Intervention,
    PredictionHistoryResponse, PredictionHistoryList
)
from app.database import get_db, Prediction as PredictionDB, User
from app.services.ml_model import predict_dropout_risk, load_model

router = APIRouter()

# Load model on startup
load_model()

@router.post("/predict", response_model=PredictionResponse)
async def predict(
    student: StudentFeatures,
    user_id: int = 1,  # For now, default user
    db: Session = Depends(get_db)
):
    """Predict dropout risk and save to database"""
    try:
        # Get prediction
        result = predict_dropout_risk(student.dict())
        
        # Save to database
        prediction_db = PredictionDB(
            user_id=user_id,
            student_data=student.dict(),
            risk_score=result["risk_score"],
            risk_category=result["risk_category"],
            top_factors=result["top_factors"],
            interventions=result["interventions"]
        )
        db.add(prediction_db)
        db.commit()
        db.refresh(prediction_db)
        
        # Map response
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

@router.get("/history", response_model=PredictionHistoryList)
async def get_history(
    user_id: int = 1,
    limit: int = 100,
    skip: int = 0,
    db: Session = Depends(get_db)
):
    """Get prediction history for a user"""
    predictions = db.query(PredictionDB).filter(
        PredictionDB.user_id == user_id
    ).order_by(PredictionDB.created_at.desc()).offset(skip).limit(limit).all()
    
    total = db.query(PredictionDB).filter(
        PredictionDB.user_id == user_id
    ).count()
    
    return PredictionHistoryList(
        total=total,
        predictions=[
            PredictionHistoryResponse(
                id=p.id,
                student_data=p.student_data,
                risk_score=p.risk_score,
                risk_category=p.risk_category,
                top_factors=p.top_factors,
                interventions=p.interventions,
                created_at=p.created_at
            )
            for p in predictions
        ]
    )

@router.get("/history/{prediction_id}", response_model=PredictionHistoryResponse)
async def get_prediction(
    prediction_id: int,
    user_id: int = 1,
    db: Session = Depends(get_db)
):
    """Get a specific prediction by ID"""
    prediction = db.query(PredictionDB).filter(
        PredictionDB.id == prediction_id,
        PredictionDB.user_id == user_id
    ).first()
    
    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found"
        )
    
    return PredictionHistoryResponse(
        id=prediction.id,
        student_data=prediction.student_data,
        risk_score=prediction.risk_score,
        risk_category=prediction.risk_category,
        top_factors=prediction.top_factors,
        interventions=prediction.interventions,
        created_at=prediction.created_at
    )

@router.delete("/history/{prediction_id}")
async def delete_prediction(
    prediction_id: int,
    user_id: int = 1,
    db: Session = Depends(get_db)
):
    """Delete a prediction by ID"""
    prediction = db.query(PredictionDB).filter(
        PredictionDB.id == prediction_id,
        PredictionDB.user_id == user_id
    ).first()
    
    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found"
        )
    
    db.delete(prediction)
    db.commit()
    return {"message": "Prediction deleted successfully"}

@router.get("/stats")
async def get_stats(
    user_id: int = 1,
    db: Session = Depends(get_db)
):
    """Get statistics for a user"""
    predictions = db.query(PredictionDB).filter(PredictionDB.user_id == user_id).all()
    
    if not predictions:
        return {
            "total": 0,
            "average_risk": 0,
            "risk_distribution": {"Low": 0, "Medium": 0, "High": 0},
            "top_risk_factors": []
        }
    
    # Calculate stats
    avg_risk = sum(p.risk_score for p in predictions) / len(predictions)
    risk_counts = {"Low": 0, "Medium": 0, "High": 0}
    for p in predictions:
        risk_counts[p.risk_category] += 1
    
    # Aggregate top factors
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