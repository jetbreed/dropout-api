# fastapi-backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, predict, students, analytics
from app.database import SessionLocal, User
from app.auth import get_password_hash
# fastapi-backend/app/main.py - Add seed routes
from app.routes import seed
from app.routes import train


app = FastAPI(
    title="Student Dropout Risk Prediction API",
    description="AI-powered API with JWT authentication, 2FA, and email verification",
    version="3.0.0"
)

# Add this line
app.include_router(train.router, prefix="/api/v1", tags=["training"])

# Add this line after other route inclusions
app.include_router(seed.router, prefix="/api/v1", tags=["seed"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-app.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Dropout Prediction API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(predict.router, prefix="/api/v1/predict", tags=["predictions"])
app.include_router(students.router, prefix="/api/v1", tags=["students"])
app.include_router(analytics.router, prefix="/api/v1", tags=["analytics"])

@app.on_event("startup")
async def create_default_admin():
    from app.database import SessionLocal, User
    from app.auth import get_password_hash
    
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin_user = User(
                username="admin",
                email="admin@dropout-api.com",
                hashed_password=get_password_hash("admin123"),
                role="admin",
                is_active=True,
                is_verified=True
            )
            db.add(admin_user)
            db.commit()
            print("✅ Default admin user created: admin / admin123")
        else:
            print("✅ Admin user already exists")
    except Exception as e:
        print(f"⚠️ Error creating admin: {e}")
    finally:
        db.close()