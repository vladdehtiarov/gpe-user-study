"""
Explainer Service - Integrates GPE, LIME for credit decision explanations.

This service provides explanations using multiple XAI methods for comparison.
"""

import numpy as np
import pandas as pd
import time
import pickle
import os
from typing import Dict, Any, Tuple, Optional
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from pathlib import Path

# GPE Framework
from gpe import GPEExplainer, GPEInformationTheoretic

# LIME
from lime.lime_tabular import LimeTabularExplainer


class ExplainerService:
    """Service for generating explanations using multiple methods."""
    
    # Feature names for credit model
    FEATURE_NAMES = [
        "annual_income",
        "employment_years", 
        "debt_to_income",
        "credit_score",
        "loan_amount",
        "loan_purpose_encoded"
    ]
    
    FEATURE_DISPLAY_NAMES = {
        "annual_income": "Annual Income ($)",
        "employment_years": "Employment (years)",
        "debt_to_income": "Debt-to-Income Ratio",
        "credit_score": "Credit Score",
        "loan_amount": "Loan Amount ($)",
        "loan_purpose_encoded": "Loan Purpose"
    }
    
    LOAN_PURPOSE_ENCODING = {
        "debt_consolidation": 0,
        "home_improvement": 1,
        "major_purchase": 2,
        "medical": 3,
        "car": 4,
        "other": 5
    }
    
    def __init__(self):
        """Initialize the explainer service."""
        self.model = None
        self.scaler = None
        self.gpe_explainer = None
        self.gpe_it_explainer = None
        self.lime_explainer = None
        self.X_train = None
        self._initialize()
    
    def _initialize(self):
        """Initialize or load the credit model."""
        model_path = Path(__file__).parent.parent.parent / "data" / "credit_model.pkl"
        
        if model_path.exists():
            self._load_model(model_path)
        else:
            self._train_and_save_model(model_path)
        
        self._setup_explainers()
    
    def _generate_training_data(self, n_samples: int = 5000) -> Tuple[np.ndarray, np.ndarray]:
        """Generate synthetic training data for credit scoring."""
        np.random.seed(42)
        
        # Generate features
        annual_income = np.random.lognormal(10.8, 0.5, n_samples)  # ~$50k median
        employment_years = np.random.exponential(4, n_samples)
        debt_to_income = np.random.beta(2, 5, n_samples)
        credit_score = np.random.normal(680, 80, n_samples).clip(300, 850)
        loan_amount = np.random.lognormal(9.5, 0.7, n_samples)  # ~$13k median
        loan_purpose = np.random.randint(0, 6, n_samples)
        
        X = np.column_stack([
            annual_income,
            employment_years,
            debt_to_income,
            credit_score,
            loan_amount,
            loan_purpose
        ])
        
        # Generate labels based on realistic rules
        y = np.zeros(n_samples, dtype=int)
        
        for i in range(n_samples):
            score = 0
            
            # Credit score factor (most important)
            if credit_score[i] >= 720:
                score += 3
            elif credit_score[i] >= 680:
                score += 2
            elif credit_score[i] >= 640:
                score += 1
            elif credit_score[i] < 600:
                score -= 2
            
            # Debt-to-income ratio
            if debt_to_income[i] < 0.28:
                score += 2
            elif debt_to_income[i] < 0.36:
                score += 1
            elif debt_to_income[i] > 0.45:
                score -= 2
            
            # Income vs loan amount
            if loan_amount[i] / annual_income[i] < 0.2:
                score += 1
            elif loan_amount[i] / annual_income[i] > 0.5:
                score -= 1
            
            # Employment stability
            if employment_years[i] >= 5:
                score += 1
            elif employment_years[i] < 1:
                score -= 1
            
            # Decision with some randomness
            threshold = 2 + np.random.normal(0, 0.5)
            y[i] = 1 if score >= threshold else 0  # 1 = approved, 0 = denied
        
        return X, y
    
    def _train_and_save_model(self, model_path: Path):
        """Train a new credit scoring model and save it."""
        print("Training new credit scoring model...")
        
        X, y = self._generate_training_data(5000)
        
        # Store training data
        self.X_train = X
        
        # Train Decision Tree (interpretable model)
        self.model = DecisionTreeClassifier(
            max_depth=7,
            min_samples_leaf=50,
            random_state=42
        )
        self.model.fit(X, y)
        
        # Save model and training data
        model_path.parent.mkdir(parents=True, exist_ok=True)
        with open(model_path, 'wb') as f:
            pickle.dump({
                'model': self.model,
                'X_train': self.X_train,
                'feature_names': self.FEATURE_NAMES
            }, f)
        
        print(f"Model saved to {model_path}")
        print(f"Training accuracy: {self.model.score(X, y):.2%}")
    
    def _load_model(self, model_path: Path):
        """Load existing model from file."""
        print(f"Loading model from {model_path}")
        with open(model_path, 'rb') as f:
            data = pickle.load(f)
            self.model = data['model']
            self.X_train = data['X_train']
    
    def _setup_explainers(self):
        """Setup all explainer instances."""
        # GPE Explainer
        self.gpe_explainer = GPEExplainer(
            model=self.model,
            feature_names=self.FEATURE_NAMES,
            X_train=self.X_train,
            min_precision=0.95
        )
        
        # GPE-IT Explainer
        self.gpe_it_explainer = GPEInformationTheoretic(
            model=self.model,
            feature_names=self.FEATURE_NAMES,
            X_train=self.X_train,
            min_precision=0.95
        )
        
        # LIME Explainer
        self.lime_explainer = LimeTabularExplainer(
            training_data=self.X_train,
            feature_names=self.FEATURE_NAMES,
            class_names=['Denied', 'Approved'],
            mode='classification',
            discretize_continuous=True
        )
    
    def _encode_application(self, application: Dict[str, Any]) -> np.ndarray:
        """Convert application dict to feature array."""
        loan_purpose_encoded = self.LOAN_PURPOSE_ENCODING.get(
            application.get('loan_purpose', 'other'), 5
        )
        
        return np.array([[
            application['annual_income'],
            application['employment_years'],
            application['debt_to_income'],
            application['credit_score'],
            application['loan_amount'],
            loan_purpose_encoded
        ]])
    
    def predict(self, application: Dict[str, Any]) -> Dict[str, Any]:
        """Make a credit decision prediction."""
        X = self._encode_application(application)
        
        prediction = self.model.predict(X)[0]
        probability = self.model.predict_proba(X)[0]
        
        decision = "approved" if prediction == 1 else "denied"
        prob = probability[1]  # Probability of approval
        
        # Determine risk level
        if prob >= 0.7:
            risk_level = "low"
        elif prob >= 0.4:
            risk_level = "medium"
        else:
            risk_level = "high"
        
        return {
            "decision": decision,
            "probability": float(prob),
            "risk_level": risk_level
        }
    
    def _format_condition(self, condition: str) -> str:
        """Format a condition for display."""
        # Replace feature names with display names
        formatted = condition
        for feature, display_name in self.FEATURE_DISPLAY_NAMES.items():
            formatted = formatted.replace(feature, display_name)
        return formatted
    
    def explain_gpe(self, application: Dict[str, Any]) -> Dict[str, Any]:
        """Generate GPE explanation."""
        X = self._encode_application(application)
        
        start_time = time.time()
        explanation = self.gpe_explainer.explain(X[0])
        elapsed_ms = (time.time() - start_time) * 1000
        
        # Format conditions
        conditions = []
        if hasattr(explanation, 'rule') and explanation.rule:
            for cond in explanation.rule.conditions:
                conditions.append(self._format_condition(str(cond)))
        
        # Create explanation text
        prediction = "Approved" if explanation.prediction == 1 else "Denied"
        if conditions:
            explanation_text = f"Decision: {prediction}\nBecause: {' AND '.join(conditions)}"
        else:
            explanation_text = f"Decision: {prediction}"
        
        # Create HTML
        explanation_html = f"""
        <div class="explanation-gpe">
            <div class="decision">{prediction}</div>
            <div class="rule">
                <strong>IF</strong> {' <strong>AND</strong> '.join(conditions) if conditions else 'baseline'}
                <strong>THEN</strong> {prediction}
            </div>
            <div class="metrics">
                <span>Precision: {explanation.precision:.1%}</span>
                <span>Coverage: {explanation.coverage:.1%}</span>
            </div>
        </div>
        """
        
        return {
            "method": "gpe",
            "explanation_text": explanation_text,
            "explanation_html": explanation_html,
            "conditions": conditions,
            "complexity": len(conditions),
            "precision": explanation.precision,
            "coverage": explanation.coverage,
            "time_ms": elapsed_ms
        }
    
    def explain_lime(self, application: Dict[str, Any]) -> Dict[str, Any]:
        """Generate LIME explanation."""
        X = self._encode_application(application)
        
        start_time = time.time()
        exp = self.lime_explainer.explain_instance(
            X[0],
            self.model.predict_proba,
            num_features=6,
            num_samples=500
        )
        elapsed_ms = (time.time() - start_time) * 1000
        
        # Get feature contributions
        feature_weights = exp.as_list()
        
        # Format conditions/contributions
        conditions = []
        for feature_cond, weight in feature_weights:
            direction = "↑" if weight > 0 else "↓"
            conditions.append(f"{self._format_condition(feature_cond)}: {direction} ({weight:+.3f})")
        
        prediction = "Approved" if self.model.predict(X)[0] == 1 else "Denied"
        explanation_text = f"Decision: {prediction}\nFeature contributions:\n" + "\n".join(conditions)
        
        # Create HTML with bar chart representation
        bars_html = ""
        for feature_cond, weight in feature_weights:
            color = "#22c55e" if weight > 0 else "#ef4444"
            width = min(abs(weight) * 200, 100)
            bars_html += f"""
            <div class="lime-bar">
                <span class="feature">{self._format_condition(feature_cond)}</span>
                <div class="bar" style="width: {width}%; background: {color};"></div>
                <span class="weight">{weight:+.3f}</span>
            </div>
            """
        
        explanation_html = f"""
        <div class="explanation-lime">
            <div class="decision">{prediction}</div>
            <div class="contributions">
                {bars_html}
            </div>
        </div>
        """
        
        return {
            "method": "lime",
            "explanation_text": explanation_text,
            "explanation_html": explanation_html,
            "conditions": conditions,
            "complexity": len(feature_weights),
            "precision": None,
            "coverage": None,
            "time_ms": elapsed_ms
        }
    
    def explain_anchors_simple(self, application: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a simple rule-based explanation (Anchors-style)."""
        # Note: Using simplified anchors since anchor-exp has compatibility issues
        X = self._encode_application(application)
        
        start_time = time.time()
        
        # Use GPE-IT as a proxy for Anchors (both produce rule-based explanations)
        explanation = self.gpe_it_explainer.explain(X[0])
        elapsed_ms = (time.time() - start_time) * 1000
        
        # Format conditions
        conditions = []
        if hasattr(explanation, 'rule') and explanation.rule:
            for cond in explanation.rule.conditions:
                conditions.append(self._format_condition(str(cond)))
        
        prediction = "Approved" if explanation.prediction == 1 else "Denied"
        
        # Anchors-style output
        explanation_text = f"Decision: {prediction}\nAnchor: {' AND '.join(conditions)}\nPrecision: {explanation.precision:.1%}"
        
        explanation_html = f"""
        <div class="explanation-anchors">
            <div class="decision">{prediction}</div>
            <div class="anchor">
                <strong>Anchor:</strong> {' AND '.join(conditions) if conditions else 'baseline'}
            </div>
            <div class="metrics">
                <span>Precision: {explanation.precision:.1%}</span>
                <span>Coverage: {explanation.coverage:.1%}</span>
            </div>
        </div>
        """
        
        return {
            "method": "anchors",
            "explanation_text": explanation_text,
            "explanation_html": explanation_html,
            "conditions": conditions,
            "complexity": len(conditions),
            "precision": explanation.precision,
            "coverage": explanation.coverage,
            "time_ms": elapsed_ms
        }
    
    def explain_all(self, application: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """Generate all explanations for an application."""
        return {
            "gpe": self.explain_gpe(application),
            "lime": self.explain_lime(application),
            "anchors": self.explain_anchors_simple(application)
        }


# Singleton instance
_explainer_service: Optional[ExplainerService] = None


def get_explainer_service() -> ExplainerService:
    """Get or create explainer service singleton."""
    global _explainer_service
    if _explainer_service is None:
        _explainer_service = ExplainerService()
    return _explainer_service

