# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import routes (we'll create these next)
from app.routes import predict_v1

# Create FastAPI instance
app = FastAPI(
    title="Student Dropout Risk Prediction API",
    description="AI-powered API for predicting student dropout risk with explainable factors",
    version="1.0.0",
    docs_url="/docs",  # Swagger UI at /docs
    redoc_url="/redoc"  # ReDoc at /redoc
)

# Enable CORS (allows your dashboard to call the API) Cross-Origin Resource Sharing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "Student Dropout Risk Prediction API",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include routes
app.include_router(predict_v1.router, prefix="/api/v1", tags=["predictions"])