"""
GPE User Study API

A FastAPI backend for conducting user studies comparing GPE with LIME and Anchors
for explainable credit decisions.

Author: Vladyslav Dehtiarov
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import init_db
from .routers import predict, survey
from .services.explainer_service import get_explainer_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    print("🚀 Starting GPE User Study API...")
    init_db()
    print("✅ Database initialized")
    
    # Pre-load explainer service (trains model if needed)
    print("🔧 Loading explainer service...")
    get_explainer_service()
    print("✅ Explainer service ready")
    
    yield
    
    # Shutdown
    print("👋 Shutting down...")


# Create FastAPI app
app = FastAPI(
    title="GPE User Study API",
    description="""
    API for conducting user studies comparing explanation methods for credit decisions.
    
    ## Methods Compared:
    - **GPE (Greedy-Prune-Explain)**: Minimal rule-based explanations
    - **LIME**: Feature importance-based explanations  
    - **Anchors**: High-precision rule-based explanations
    
    ## Endpoints:
    - `/api/predict`: Make credit decision predictions
    - `/api/explain`: Generate explanations using all methods
    - `/api/scenarios`: Get predefined study scenarios
    - `/api/survey/*`: Survey submission endpoints
    """,
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration - allow all origins for user study
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for the user study
    allow_credentials=False,  # Must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(predict.router)
app.include_router(survey.router)


@app.get("/")
async def root():
    """API root endpoint."""
    return {
        "message": "GPE User Study API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

