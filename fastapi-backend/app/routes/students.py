# fastapi-backend/app/routes/students.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_
from typing import List, Optional
from datetime import datetime
from app.database import get_db, Student, User, School, Prediction
from app.models import (
    StudentCreate, StudentUpdate, StudentResponse, 
    StudentListResponse
)
from app.auth import get_current_user, require_role, get_current_active_user
from app.services.ml_model import predict_dropout_risk

router = APIRouter(prefix="/students", tags=["students"])

# ============================================
# CREATE STUDENT
# ============================================

# fastapi-backend/app/routes/students.py - Fixed create_student

@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    student_data: StudentCreate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Create a new student (Admin only)
    """
    # Check if email exists
    existing = db.query(Student).filter(Student.email == student_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student with this email already exists"
        )
    
    # If school_id is provided, verify it exists
    if student_data.school_id:
        school = db.query(School).filter(School.id == student_data.school_id).first()
        if not school:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="School not found"
            )
    
    # Create student
    student = Student(
        user_id=current_user.id,
        first_name=student_data.first_name,
        last_name=student_data.last_name,
        email=student_data.email,
        date_of_birth=student_data.date_of_birth,
        grade_level=student_data.grade_level,
        school_id=student_data.school_id,
        age=student_data.age,
        gender=student_data.gender,
        previous_grade=student_data.previous_grade,
        attendance_rate=student_data.attendance_rate,
        assignments_completed=student_data.assignments_completed,
        test_scores_avg=student_data.test_scores_avg,
        days_absent_last_term=student_data.days_absent_last_term,
        late_arrivals=student_data.late_arrivals,
        disciplinary_incidents=student_data.disciplinary_incidents,
        parent_education_level=student_data.parent_education_level,
        family_income_level=student_data.family_income_level,
        has_internet_access=student_data.has_internet_access,
        is_active=True
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    
    return StudentResponse(
        id=student.id,
        user_id=student.user_id,
        first_name=student.first_name,
        last_name=student.last_name,
        email=student.email,
        grade_level=student.grade_level,
        age=student.age,
        gender=student.gender,
        attendance_rate=student.attendance_rate,
        assignments_completed=student.assignments_completed,
        test_scores_avg=student.test_scores_avg,
        days_absent_last_term=student.days_absent_last_term,
        risk_score=None,
        risk_category=None,
        created_at=student.created_at,
        updated_at=student.updated_at
    )

# ============================================
# GET STUDENTS (PAGINATED)
# ============================================

# fastapi-backend/app/routes/students.py - Fixed get_students

# fastapi-backend/app/routes/students.py
# Update the get_students function to allow students to see their own data

@router.get("/", response_model=StudentListResponse)
async def get_students(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    grade_level: Optional[int] = Query(None, ge=1, le=12, description="Filter by grade"),
    risk_category: Optional[str] = Query(None, description="Filter by risk category"),
    sort_by: Optional[str] = Query("created_at", description="Sort field"),
    sort_order: Optional[str] = Query("desc", description="Sort order (asc/desc)"),
    current_user: User = Depends(get_current_user),  # Changed from require_role("admin")
    db: Session = Depends(get_db)
):
    """
    Get paginated list of students with risk scores.
    Admin can see all students. Students can only see their own profile.
    """
    # Base query
    query = db.query(Student)
    
    # If user is not admin, filter to only their own student record
    if current_user.role != "admin":
        query = query.filter(Student.user_id == current_user.id)
    
    # Rest of the function remains the same...
    
    # Search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Student.first_name.ilike(search_term),
                Student.last_name.ilike(search_term),
                Student.email.ilike(search_term)
            )
        )
    
    # Grade filter
    if grade_level:
        query = query.filter(Student.grade_level == grade_level)
    
    # Get all students first to apply risk filter (we'll filter after getting predictions)
    students = query.all()
    
    # Get latest prediction for each student
    student_responses = []
    for student in students:
        latest_pred = db.query(Prediction).filter(
            Prediction.student_id == student.id
        ).order_by(desc(Prediction.created_at)).first()
        
        student_responses.append({
            "student": student,
            "risk_score": latest_pred.risk_score if latest_pred else None,
            "risk_category": latest_pred.risk_category if latest_pred else None,
            "created_at": student.created_at,
            "updated_at": student.updated_at
        })
    
    # Filter by risk category
    if risk_category:
        student_responses = [
            s for s in student_responses 
            if s["risk_category"] == risk_category
        ]
    
    # Sort
    if sort_by == "risk_score":
        student_responses.sort(
            key=lambda x: x["risk_score"] if x["risk_score"] is not None else -1,
            reverse=(sort_order == "desc")
        )
    elif sort_by == "first_name":
        student_responses.sort(
            key=lambda x: x["student"].first_name,
            reverse=(sort_order == "desc")
        )
    elif sort_by == "last_name":
        student_responses.sort(
            key=lambda x: x["student"].last_name,
            reverse=(sort_order == "desc")
        )
    elif sort_by == "attendance_rate":
        student_responses.sort(
            key=lambda x: x["student"].attendance_rate,
            reverse=(sort_order == "desc")
        )
    else:
        student_responses.sort(
            key=lambda x: x["created_at"],
            reverse=(sort_order == "desc")
        )
    
    # Pagination
    total = len(student_responses)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    start = (page - 1) * page_size
    end = start + page_size
    paginated = student_responses[start:end]
    
    # In the get_students function, update the response construction:

    return StudentListResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        students=[
            StudentResponse(
                id=s["student"].id,
                user_id=s["student"].user_id,
                first_name=s["student"].first_name,
                last_name=s["student"].last_name,
                email=s["student"].email,
                grade_level=s["student"].grade_level,
                age=s["student"].age,
                gender=s["student"].gender,
                previous_grade=s["student"].previous_grade,
                attendance_rate=s["student"].attendance_rate,
                assignments_completed=s["student"].assignments_completed,
                test_scores_avg=s["student"].test_scores_avg,
                days_absent_last_term=s["student"].days_absent_last_term,
                late_arrivals=s["student"].late_arrivals,              # ✅ Add
                disciplinary_incidents=s["student"].disciplinary_incidents,  # ✅ Add
                parent_education_level=s["student"].parent_education_level,  # ✅ Add
                family_income_level=s["student"].family_income_level,  # ✅ Add
                has_internet_access=s["student"].has_internet_access,  # ✅ Add
                risk_score=s["risk_score"],
                risk_category=s["risk_category"],
                created_at=s["created_at"],
                updated_at=s["updated_at"]
            )
            for s in paginated
        ]
    )

# ============================================
# GET SINGLE STUDENT
# ============================================

# fastapi-backend/app/routes/students.py - Fixed get_student

@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific student by ID
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Check permissions
    if current_user.role != "admin" and student.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this student"
        )
    
    # Get latest prediction
    latest_pred = db.query(Prediction).filter(
        Prediction.student_id == student.id
    ).order_by(desc(Prediction.created_at)).first()
    
    # In the get_student function:
    return StudentResponse(
        id=student.id,
        user_id=student.user_id,
        first_name=student.first_name,
        last_name=student.last_name,
        email=student.email,
        grade_level=student.grade_level,
        age=student.age,
        gender=student.gender,
        previous_grade=student.previous_grade,
        attendance_rate=student.attendance_rate,
        assignments_completed=student.assignments_completed,
        test_scores_avg=student.test_scores_avg,
        days_absent_last_term=student.days_absent_last_term,
        late_arrivals=student.late_arrivals,              # ✅ Add
        disciplinary_incidents=student.disciplinary_incidents,  # ✅ Add
        parent_education_level=student.parent_education_level,  # ✅ Add
        family_income_level=student.family_income_level,  # ✅ Add
        has_internet_access=student.has_internet_access,  # ✅ Add
        risk_score=latest_pred.risk_score if latest_pred else None,
        risk_category=latest_pred.risk_category if latest_pred else None,
        created_at=student.created_at,
        updated_at=student.updated_at
    )
    
# ============================================
# UPDATE STUDENT
# ============================================

@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: int,
    student_data: StudentUpdate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Update a student (Admin only)
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Update fields
    update_data = student_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(student, key, value)
    
    student.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(student)
    
    # Get latest prediction
    latest_pred = db.query(Prediction).filter(
        Prediction.student_id == student.id
    ).order_by(desc(Prediction.created_at)).first()
    
    return StudentResponse(
        id=student.id,
        user_id=student.user_id,
        student_id=student.student_id,
        first_name=student.first_name,
        last_name=student.last_name,
        email=student.email,
        grade_level=student.grade_level,
        age=student.age,
        gender=student.gender,
        attendance_rate=student.attendance_rate,
        assignments_completed=student.assignments_completed,
        test_scores_avg=student.test_scores_avg,
        days_absent_last_term=student.days_absent_last_term,
        risk_score=latest_pred.risk_score if latest_pred else None,
        risk_category=latest_pred.risk_category if latest_pred else None,
        created_at=student.created_at,
        updated_at=student.updated_at
    )


# fastapi-backend/app/routes/students.py
# Add this endpoint

@router.put("/{student_id}/link-user")
async def link_student_to_user(
    student_id: int,
    user_id: int,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Link a student profile to a user account (Admin only)"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    student.user_id = user_id
    db.commit()
    db.refresh(student)
    
    return {"message": f"Student {student_id} linked to user {user_id}"}
# ============================================
# DELETE STUDENT
# ============================================

@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: int,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Delete a student (Admin only)
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    db.delete(student)
    db.commit()
    
    return None

# ============================================
# PREDICT STUDENT RISK
# ============================================

@router.post("/{student_id}/predict", response_model=dict)
async def predict_student_risk(
    student_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Run prediction for a specific student
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Check permissions: admin can predict all, students can only predict themselves
    if current_user.role != "admin" and student.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to predict for this student"
        )
    
    # Prepare features for prediction
    features = {
        "age": student.age,
        "gender": student.gender,
        "previous_grade": student.previous_grade,
        "attendance_rate": student.attendance_rate,
        "assignments_completed": student.assignments_completed,
        "test_scores_avg": student.test_scores_avg,
        "days_absent_last_term": student.days_absent_last_term,
        "late_arrivals": student.late_arrivals,
        "disciplinary_incidents": student.disciplinary_incidents,
        "parent_education_level": student.parent_education_level,
        "family_income_level": student.family_income_level,
        "has_internet_access": student.has_internet_access
    }
    
    try:
        # Get prediction from ML model
        result = predict_dropout_risk(features)
        
        # Save prediction to database
        prediction = Prediction(
            user_id=current_user.id,
            student_id=student.id,
            student_data=features,
            risk_score=result["risk_score"],
            risk_category=result["risk_category"],
            top_factors=result["top_factors"],
            interventions=result["interventions"]
        )
        db.add(prediction)
        db.commit()
        db.refresh(prediction)
        
        return {
            "student_id": student.id,
            "student_name": f"{student.first_name} {student.last_name}",
            "risk_score": result["risk_score"],
            "risk_category": result["risk_category"],
            "top_factors": result["top_factors"],
            "interventions": result["interventions"],
            "prediction_id": prediction.id,
            "created_at": prediction.created_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

# ============================================
# GET STUDENT PREDICTIONS HISTORY
# ============================================

@router.get("/{student_id}/predictions", response_model=dict)
async def get_student_predictions(
    student_id: int,
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get prediction history for a specific student
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Check permissions
    if current_user.role != "admin" and student.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    predictions = db.query(Prediction).filter(
        Prediction.student_id == student.id
    ).order_by(desc(Prediction.created_at)).limit(limit).all()
    
    return {
        "student_id": student.id,
        "student_name": f"{student.first_name} {student.last_name}",
        "total": len(predictions),
        "predictions": [
            {
                "id": p.id,
                "risk_score": p.risk_score,
                "risk_category": p.risk_category,
                "top_factors": p.top_factors,
                "interventions": p.interventions,
                "created_at": p.created_at.isoformat()
            }
            for p in predictions
        ]
    }