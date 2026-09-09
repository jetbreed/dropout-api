# fastapi-backend/app/routes/seed.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import numpy as np
import traceback
from datetime import datetime
from pydantic import BaseModel
from app.database import get_db, Student, User, Prediction
from app.auth import get_current_user, require_role
from app.services.ml_model import predict_dropout_risk

router = APIRouter(prefix="/seed", tags=["seed"])

class SeedRequest(BaseModel):
    count: int = 10

def to_python_value(val):
    """Convert numpy types to Python native types"""
    if isinstance(val, np.integer):
        return int(val)
    elif isinstance(val, np.floating):
        return float(val)
    elif isinstance(val, np.str_):
        return str(val)
    elif isinstance(val, np.ndarray):
        return val.tolist()
    elif isinstance(val, np.bool_):
        return bool(val)
    return val

def generate_unique_email(first_name: str, last_name: str, index: int, timestamp: int) -> str:
    """Generate a unique email address"""
    return f"{first_name.lower()}.{last_name.lower()}.{timestamp}.{index}@school.com"

@router.post("/students")
async def seed_students(
    request: SeedRequest,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Seed synthetic student data into the database."""
    count = request.count
    try:
        # Update the seed function to generate more diverse data
        # At the beginning of the loop, add more variety:

        # Generate unique names with more variety
        first_names = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Jessica',
                    'Robert', 'Ashley', 'William', 'Amanda', 'Joseph', 'Jennifer', 'Daniel',
                    'Elizabeth', 'Thomas', 'Melissa', 'Matthew', 'Patricia', 'Christopher',
                    'Linda', 'Anthony', 'Barbara', 'Mark', 'Susan', 'Paul', 'Margaret',
                    'Steven', 'Dorothy', 'Andrew', 'Betty', 'Joshua', 'Helen', 'Kenneth',
                    'Sharon', 'Kevin', 'Deborah', 'Brian', 'Rachel', 'George', 'Carol']

        last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
                    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas',
                    'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
                    'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
                    'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill']

        students_created = []
        np.random.seed(None)
        
        existing_count = db.query(Student).count()
        timestamp = int(datetime.utcnow().timestamp())

        for i in range(count):
            first_name = to_python_value(np.random.choice(first_names))
            last_name = to_python_value(np.random.choice(last_names))
            
            age = int(np.random.randint(10, 20))
            gender = int(np.random.choice([0, 1]))
            
            previous_grade = float(np.random.normal(65, 15))
            previous_grade = float(max(0, min(100, previous_grade)))
            
            attendance_rate = float(np.random.normal(75, 20))
            attendance_rate = float(max(0, min(100, attendance_rate)))
            
            assignments_completed = float(np.random.normal(70, 25))
            assignments_completed = float(max(0, min(100, assignments_completed)))
            
            test_scores_avg = float(np.random.normal(65, 15))
            test_scores_avg = float(max(0, min(100, test_scores_avg)))
            
            days_absent_last_term = int(np.random.poisson(5))
            late_arrivals = int(np.random.poisson(3))
            disciplinary_incidents = int(np.random.poisson(1))
            parent_education_level = int(np.random.choice([1, 2, 3, 4, 5], p=[0.2, 0.3, 0.25, 0.15, 0.1]))
            family_income_level = int(np.random.choice([1, 2, 3, 4, 5], p=[0.2, 0.3, 0.25, 0.15, 0.1]))
            has_internet_access = int(np.random.choice([0, 1], p=[0.4, 0.6]))
            
            email = generate_unique_email(first_name, last_name, existing_count + i, timestamp)
            
            student = Student(
                user_id=current_user.id,
                first_name=first_name,
                last_name=last_name,
                email=email,
                age=age,
                gender=gender,
                previous_grade=round(previous_grade, 1),
                attendance_rate=round(attendance_rate, 1),
                assignments_completed=round(assignments_completed, 1),
                test_scores_avg=round(test_scores_avg, 1),
                days_absent_last_term=days_absent_last_term,
                late_arrivals=late_arrivals,
                disciplinary_incidents=disciplinary_incidents,
                parent_education_level=parent_education_level,
                family_income_level=family_income_level,
                has_internet_access=has_internet_access,
                is_active=True
            )
            db.add(student)
            students_created.append(student)
        
        db.commit()
        
        for student in students_created:
            db.refresh(student)
        
        predictions_count = 0
        for student in students_created:
            try:
                features = {
                    "age": int(student.age),
                    "gender": int(student.gender),
                    "previous_grade": float(student.previous_grade),
                    "attendance_rate": float(student.attendance_rate),
                    "assignments_completed": float(student.assignments_completed),
                    "test_scores_avg": float(student.test_scores_avg),
                    "days_absent_last_term": int(student.days_absent_last_term),
                    "late_arrivals": int(student.late_arrivals),
                    "disciplinary_incidents": int(student.disciplinary_incidents),
                    "parent_education_level": int(student.parent_education_level),
                    "family_income_level": int(student.family_income_level),
                    "has_internet_access": int(student.has_internet_access)
                }
                
                result = predict_dropout_risk(features)
                
                prediction = Prediction(
                    user_id=current_user.id,
                    student_id=student.id,
                    student_data=features,
                    risk_score=float(result["risk_score"]),
                    risk_category=str(result["risk_category"]),
                    top_factors=result["top_factors"],
                    interventions=result["interventions"]
                )
                db.add(prediction)
                predictions_count += 1
            except Exception as e:
                print(f"Prediction failed for student {student.id}: {e}")
        
        db.commit()
        
        return {
            "message": f"✅ Seeded {count} students successfully",
            "count": count,
            "predictions_made": predictions_count,
            "total_students": db.query(Student).count()
        }
    except Exception as e:
        print(f"Error in seed: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error seeding students: {str(e)}"
        )

@router.delete("/all")
async def delete_all_students(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Delete all students (Admin only) - Use with caution!"""
    try:
        db.query(Prediction).delete()
        db.query(Student).delete()
        db.commit()
        return {"message": "✅ All students and predictions deleted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting students: {str(e)}"
        )

@router.get("/status")
async def seed_status(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Check seed status"""
    count = db.query(Student).count()
    pred_count = db.query(Prediction).count()
    return {
        "total_students": count,
        "total_predictions": pred_count,
        "has_data": count > 0
    }