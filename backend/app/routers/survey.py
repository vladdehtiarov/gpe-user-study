"""Survey and session management endpoints."""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from ..database import get_db, init_db, StudySession, ScenarioResponse, ExplanationRating, FinalSurvey
from ..models.schemas import (
    SessionCreate, 
    SessionResponse, 
    ExplanationRatingInput,
    FinalSurveyInput
)

router = APIRouter(prefix="/api/survey", tags=["survey"])


@router.post("/session", response_model=SessionResponse)
async def create_session(session_data: SessionCreate, db: Session = Depends(get_db)):
    """Create a new study session."""
    session_id = str(uuid.uuid4())
    
    db_session = StudySession(
        session_id=session_id,
        user_agent=session_data.user_agent
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    
    return SessionResponse(
        session_id=session_id,
        created_at=db_session.created_at
    )


@router.post("/rating")
async def submit_rating(rating: ExplanationRatingInput, db: Session = Depends(get_db)):
    """Submit a rating for an explanation."""
    db_rating = ExplanationRating(
        session_id=rating.session_id,
        scenario_id=rating.scenario_id,
        method=rating.method,
        clarity=rating.clarity,
        confidence=rating.confidence,
        trust=rating.trust,
        actionability=rating.actionability,
        view_time_ms=rating.view_time_ms
    )
    db.add(db_rating)
    db.commit()
    
    return {"status": "success", "message": "Rating submitted"}


@router.post("/final")
async def submit_final_survey(survey: FinalSurveyInput, db: Session = Depends(get_db)):
    """Submit final survey results."""
    # Check if already submitted
    existing = db.query(FinalSurvey).filter(
        FinalSurvey.session_id == survey.session_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Survey already submitted")
    
    db_survey = FinalSurvey(
        session_id=survey.session_id,
        gpe_rank=survey.gpe_rank,
        lime_rank=survey.lime_rank,
        anchors_rank=survey.anchors_rank,
        preferred_method=survey.preferred_method,
        age_group=survey.age_group,
        education=survey.education,
        ml_familiarity=survey.ml_familiarity,
        feedback=survey.feedback
    )
    db.add(db_survey)
    
    # Mark session as completed
    session = db.query(StudySession).filter(
        StudySession.session_id == survey.session_id
    ).first()
    if session:
        session.completed_at = datetime.utcnow()
    
    db.commit()
    
    return {"status": "success", "message": "Survey submitted"}


@router.get("/results")
async def get_study_results(db: Session = Depends(get_db)):
    """Get aggregated study results (for research purposes)."""
    # Count completed sessions
    total_sessions = db.query(StudySession).count()
    completed_sessions = db.query(StudySession).filter(
        StudySession.completed_at.isnot(None)
    ).count()
    
    # Get average ratings by method
    ratings = db.query(ExplanationRating).all()
    
    method_stats = {}
    for method in ['gpe', 'lime', 'anchors']:
        method_ratings = [r for r in ratings if r.method == method]
        if method_ratings:
            method_stats[method] = {
                'clarity': sum(r.clarity for r in method_ratings) / len(method_ratings),
                'confidence': sum(r.confidence for r in method_ratings) / len(method_ratings),
                'trust': sum(r.trust for r in method_ratings) / len(method_ratings),
                'actionability': sum(r.actionability for r in method_ratings) / len(method_ratings),
                'count': len(method_ratings)
            }
    
    # Get preference distribution
    final_surveys = db.query(FinalSurvey).all()
    preference_counts = {'gpe': 0, 'lime': 0, 'anchors': 0}
    for survey in final_surveys:
        if survey.preferred_method in preference_counts:
            preference_counts[survey.preferred_method] += 1
    
    return {
        'total_sessions': total_sessions,
        'completed_sessions': completed_sessions,
        'method_ratings': method_stats,
        'preference_distribution': preference_counts
    }


@router.get("/results/detailed")
async def get_detailed_results(db: Session = Depends(get_db)):
    """Get all raw data (for detailed analysis)."""
    sessions = db.query(StudySession).all()
    ratings = db.query(ExplanationRating).all()
    final_surveys = db.query(FinalSurvey).all()
    
    return {
        'sessions': [
            {
                'session_id': s.session_id,
                'created_at': s.created_at.isoformat() if s.created_at else None,
                'completed_at': s.completed_at.isoformat() if s.completed_at else None
            }
            for s in sessions
        ],
        'ratings': [
            {
                'session_id': r.session_id,
                'scenario_id': r.scenario_id,
                'method': r.method,
                'clarity': r.clarity,
                'confidence': r.confidence,
                'trust': r.trust,
                'actionability': r.actionability,
                'view_time_ms': r.view_time_ms,
                'created_at': r.created_at.isoformat() if r.created_at else None
            }
            for r in ratings
        ],
        'final_surveys': [
            {
                'session_id': f.session_id,
                'gpe_rank': f.gpe_rank,
                'lime_rank': f.lime_rank,
                'anchors_rank': f.anchors_rank,
                'preferred_method': f.preferred_method,
                'age_group': f.age_group,
                'education': f.education,
                'ml_familiarity': f.ml_familiarity,
                'feedback': f.feedback,
                'created_at': f.created_at.isoformat() if f.created_at else None
            }
            for f in final_surveys
        ]
    }


@router.get("/results/export")
async def export_results_csv(db: Session = Depends(get_db)):
    """Export results as CSV-ready JSON."""
    ratings = db.query(ExplanationRating).all()
    
    # Flatten ratings for CSV export
    rows = []
    for r in ratings:
        rows.append({
            'session_id': r.session_id,
            'scenario_id': r.scenario_id,
            'method': r.method,
            'clarity': r.clarity,
            'confidence': r.confidence,
            'trust': r.trust,
            'actionability': r.actionability,
            'avg_rating': (r.clarity + r.confidence + r.trust + r.actionability) / 4,
            'view_time_ms': r.view_time_ms
        })
    
    return {'data': rows, 'count': len(rows)}


@router.on_event("startup")
async def startup():
    """Initialize database on startup."""
    init_db()

