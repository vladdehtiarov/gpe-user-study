"""Database configuration and models."""

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./user_study.db")

# Fix for Render PostgreSQL URL
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class StudySession(Base):
    """User study session."""
    __tablename__ = "study_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    user_agent = Column(String(500), nullable=True)
    

class ScenarioResponse(Base):
    """Response to a single scenario."""
    __tablename__ = "scenario_responses"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), index=True)
    scenario_id = Column(Integer)
    
    # Prediction info
    prediction = Column(String(20))  # approved/denied
    
    # Input features
    input_data = Column(JSON)
    
    # Explanations shown
    explanations = Column(JSON)
    
    # Timing (milliseconds)
    gpe_time_ms = Column(Float)
    lime_time_ms = Column(Float)
    anchors_time_ms = Column(Float)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class ExplanationRating(Base):
    """Rating for a single explanation."""
    __tablename__ = "explanation_ratings"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), index=True)
    scenario_id = Column(Integer)
    method = Column(String(20))  # gpe, lime, anchors
    
    # Ratings (1-7 Likert scale)
    clarity = Column(Integer)
    confidence = Column(Integer)
    trust = Column(Integer)
    actionability = Column(Integer)
    
    # Time spent viewing this explanation (ms)
    view_time_ms = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class FinalSurvey(Base):
    """Final survey responses."""
    __tablename__ = "final_surveys"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), unique=True, index=True)
    
    # Preference ranking (1=best, 3=worst)
    gpe_rank = Column(Integer)
    lime_rank = Column(Integer)
    anchors_rank = Column(Integer)
    
    # Overall preference
    preferred_method = Column(String(20))
    
    # Demographics (optional)
    age_group = Column(String(20), nullable=True)
    education = Column(String(50), nullable=True)
    ml_familiarity = Column(Integer, nullable=True)  # 1-7
    
    # Free text
    feedback = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)


def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)

