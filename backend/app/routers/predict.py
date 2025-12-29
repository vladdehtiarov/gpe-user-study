"""Prediction and explanation endpoints."""

from fastapi import APIRouter, HTTPException
from ..models.schemas import (
    CreditApplication, 
    PredictionResult, 
    AllExplanations,
    ExplanationResult,
    STUDY_SCENARIOS
)
from ..services.explainer_service import get_explainer_service
import random

router = APIRouter(prefix="/api", tags=["predictions"])


@router.post("/predict", response_model=PredictionResult)
async def predict_credit_decision(application: CreditApplication):
    """Make a credit decision prediction."""
    service = get_explainer_service()
    result = service.predict(application.model_dump())
    return PredictionResult(**result)


@router.post("/explain", response_model=AllExplanations)
async def explain_credit_decision(application: CreditApplication, scenario_id: int = 0):
    """Generate explanations for a credit decision using all methods."""
    service = get_explainer_service()
    
    # Get prediction
    prediction = service.predict(application.model_dump())
    
    # Get all explanations
    explanations_raw = service.explain_all(application.model_dump())
    
    # Convert to response models
    explanations = {
        method: ExplanationResult(**exp_data)
        for method, exp_data in explanations_raw.items()
    }
    
    return AllExplanations(
        prediction=PredictionResult(**prediction),
        input_data=application.model_dump(),
        explanations=explanations,
        scenario_id=scenario_id
    )


@router.get("/scenarios")
async def get_scenarios():
    """Get all study scenarios."""
    return {
        "scenarios": [
            {
                "id": s.id,
                "name": s.name,
                "description": s.description,
                "application": s.application.model_dump()
            }
            for s in STUDY_SCENARIOS
        ]
    }


@router.get("/scenario/{scenario_id}")
async def get_scenario(scenario_id: int):
    """Get a specific scenario."""
    for scenario in STUDY_SCENARIOS:
        if scenario.id == scenario_id:
            return {
                "id": scenario.id,
                "name": scenario.name,
                "description": scenario.description,
                "application": scenario.application.model_dump()
            }
    
    raise HTTPException(status_code=404, detail="Scenario not found")


@router.get("/scenario/{scenario_id}/explain")
async def explain_scenario(scenario_id: int, randomize_order: bool = True):
    """Get explanations for a predefined scenario."""
    scenario = None
    for s in STUDY_SCENARIOS:
        if s.id == scenario_id:
            scenario = s
            break
    
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    service = get_explainer_service()
    
    # Get prediction
    prediction = service.predict(scenario.application.model_dump())
    
    # Get all explanations
    explanations_raw = service.explain_all(scenario.application.model_dump())
    
    # Randomize order for unbiased comparison
    methods = list(explanations_raw.keys())
    if randomize_order:
        random.shuffle(methods)
    
    # Create ordered explanations with anonymous labels
    ordered_explanations = {}
    method_mapping = {}  # Maps "Method A" -> actual method name
    
    for i, method in enumerate(methods):
        label = chr(65 + i)  # A, B, C
        ordered_explanations[f"method_{label}"] = ExplanationResult(**explanations_raw[method])
        method_mapping[f"method_{label}"] = method
    
    return {
        "scenario": {
            "id": scenario.id,
            "name": scenario.name,
            "description": scenario.description,
            "application": scenario.application.model_dump()
        },
        "prediction": PredictionResult(**prediction),
        "explanations": ordered_explanations,
        "method_mapping": method_mapping  # Revealed after survey
    }

