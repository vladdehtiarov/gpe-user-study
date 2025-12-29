"""Pydantic schemas for API requests and responses."""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ============== Credit Application ==============

class CreditApplication(BaseModel):
    """Credit application input."""
    annual_income: float = Field(..., ge=0, description="Annual income in USD")
    employment_years: float = Field(..., ge=0, description="Years of employment")
    debt_to_income: float = Field(..., ge=0, le=1, description="Debt-to-income ratio")
    credit_score: int = Field(..., ge=300, le=850, description="Credit score")
    loan_amount: float = Field(..., ge=0, description="Requested loan amount")
    loan_purpose: str = Field(..., description="Purpose of loan")
    
    class Config:
        json_schema_extra = {
            "example": {
                "annual_income": 55000,
                "employment_years": 3.5,
                "debt_to_income": 0.35,
                "credit_score": 680,
                "loan_amount": 15000,
                "loan_purpose": "debt_consolidation"
            }
        }


class PredictionResult(BaseModel):
    """Prediction result."""
    decision: str  # "approved" or "denied"
    probability: float
    risk_level: str  # "low", "medium", "high"


# ============== Explanations ==============

class ExplanationResult(BaseModel):
    """Single explanation result."""
    method: str  # "gpe", "lime", "anchors"
    explanation_text: str
    explanation_html: str
    conditions: List[str]
    complexity: int
    precision: Optional[float] = None
    coverage: Optional[float] = None
    time_ms: float


class AllExplanations(BaseModel):
    """All explanations for a prediction."""
    prediction: PredictionResult
    input_data: Dict[str, Any]
    explanations: Dict[str, ExplanationResult]
    scenario_id: int


# ============== Survey ==============

class ExplanationRatingInput(BaseModel):
    """Rating for a single explanation."""
    session_id: str
    scenario_id: int
    method: str
    clarity: int = Field(..., ge=1, le=7)
    confidence: int = Field(..., ge=1, le=7)
    trust: int = Field(..., ge=1, le=7)
    actionability: int = Field(..., ge=1, le=7)
    view_time_ms: Optional[float] = None


class FinalSurveyInput(BaseModel):
    """Final survey input."""
    session_id: str
    gpe_rank: int = Field(..., ge=1, le=3)
    lime_rank: int = Field(..., ge=1, le=3)
    anchors_rank: int = Field(..., ge=1, le=3)
    preferred_method: str
    age_group: Optional[str] = None
    education: Optional[str] = None
    ml_familiarity: Optional[int] = Field(None, ge=1, le=7)
    feedback: Optional[str] = None


# ============== Session ==============

class SessionCreate(BaseModel):
    """Create new session."""
    user_agent: Optional[str] = None


class SessionResponse(BaseModel):
    """Session response."""
    session_id: str
    created_at: datetime


# ============== Scenarios ==============

class ScenarioConfig(BaseModel):
    """Pre-defined scenario configuration."""
    id: int
    name: str
    description: str
    application: CreditApplication
    expected_decision: str


# Pre-defined scenarios for the study
STUDY_SCENARIOS: List[ScenarioConfig] = [
    ScenarioConfig(
        id=1,
        name="Low Risk Applicant",
        description="A financially stable applicant with good credit history",
        application=CreditApplication(
            annual_income=85000,
            employment_years=7,
            debt_to_income=0.22,
            credit_score=750,
            loan_amount=10000,
            loan_purpose="home_improvement"
        ),
        expected_decision="approved"
    ),
    ScenarioConfig(
        id=2,
        name="Medium Risk Applicant",
        description="An average applicant with moderate credit metrics",
        application=CreditApplication(
            annual_income=52000,
            employment_years=2.5,
            debt_to_income=0.38,
            credit_score=650,
            loan_amount=18000,
            loan_purpose="debt_consolidation"
        ),
        expected_decision="denied"
    ),
    ScenarioConfig(
        id=3,
        name="High Risk Applicant",
        description="A high-risk applicant with concerning credit metrics",
        application=CreditApplication(
            annual_income=38000,
            employment_years=1,
            debt_to_income=0.52,
            credit_score=580,
            loan_amount=25000,
            loan_purpose="major_purchase"
        ),
        expected_decision="denied"
    ),
]

