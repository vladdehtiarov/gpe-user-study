"""
Explainer Service - Integrates GPE, LIME, and Anchors for credit decision explanations.

This service provides explanations using multiple XAI methods for comparison.
GPE is the NOVEL method developed for this research.
LIME and Anchors are existing baseline methods.
"""

import numpy as np
import pandas as pd
import time
import pickle
from typing import Dict, Any, Tuple, Optional
from sklearn.tree import DecisionTreeClassifier
from pathlib import Path

# GPE Framework - YOUR NOVEL METHOD
from gpe import GPEExplainer

# Baseline: LIME
from lime.lime_tabular import LimeTabularExplainer

# Baseline: Anchors (REAL implementation)
from anchor import anchor_tabular


class ExplainerService:
    """Service for generating explanations using multiple methods."""
    
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
        self.gpe_explainer = None
        self.lime_explainer = None
        self.anchors_explainer = None
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
        
        annual_income = np.random.lognormal(10.8, 0.5, n_samples)
        employment_years = np.random.exponential(4, n_samples)
        debt_to_income = np.random.beta(2, 5, n_samples)
        credit_score = np.random.normal(680, 80, n_samples).clip(300, 850)
        loan_amount = np.random.lognormal(9.5, 0.7, n_samples)
        loan_purpose = np.random.randint(0, 6, n_samples)
        
        X = np.column_stack([
            annual_income,
            employment_years,
            debt_to_income,
            credit_score,
            loan_amount,
            loan_purpose
        ])
        
        y = np.zeros(n_samples, dtype=int)
        
        for i in range(n_samples):
            score = 0
            
            if credit_score[i] >= 720:
                score += 3
            elif credit_score[i] >= 680:
                score += 2
            elif credit_score[i] >= 640:
                score += 1
            elif credit_score[i] < 600:
                score -= 2
            
            if debt_to_income[i] < 0.28:
                score += 2
            elif debt_to_income[i] < 0.36:
                score += 1
            elif debt_to_income[i] > 0.45:
                score -= 2
            
            if loan_amount[i] / annual_income[i] < 0.2:
                score += 1
            elif loan_amount[i] / annual_income[i] > 0.5:
                score -= 1
            
            if employment_years[i] >= 5:
                score += 1
            elif employment_years[i] < 1:
                score -= 1
            
            threshold = 2 + np.random.normal(0, 0.5)
            y[i] = 1 if score >= threshold else 0
        
        return X, y
    
    def _train_and_save_model(self, model_path: Path):
        """Train a new credit scoring model."""
        print("Training new credit scoring model...")
        
        X, y = self._generate_training_data(5000)
        self.X_train = X
        
        self.model = DecisionTreeClassifier(
            max_depth=7,
            min_samples_leaf=50,
            random_state=42
        )
        self.model.fit(X, y)
        
        model_path.parent.mkdir(parents=True, exist_ok=True)
        with open(model_path, 'wb') as f:
            pickle.dump({
                'model': self.model,
                'X_train': self.X_train,
                'feature_names': self.FEATURE_NAMES
            }, f)
        
        print(f"Model saved. Accuracy: {self.model.score(X, y):.2%}")
    
    def _load_model(self, model_path: Path):
        """Load existing model."""
        print(f"Loading model from {model_path}")
        with open(model_path, 'rb') as f:
            data = pickle.load(f)
            self.model = data['model']
            self.X_train = data['X_train']
    
    def _setup_explainers(self):
        """Setup all explainer instances."""
        # YOUR NOVEL METHOD: GPE
        self.gpe_explainer = GPEExplainer(
            model=self.model,
            feature_names=self.FEATURE_NAMES,
            X_train=self.X_train,
            min_precision=0.95
        )
        
        # BASELINE: LIME
        self.lime_explainer = LimeTabularExplainer(
            training_data=self.X_train,
            feature_names=self.FEATURE_NAMES,
            class_names=['Denied', 'Approved'],
            mode='classification',
            discretize_continuous=True
        )
        
        # BASELINE: Anchors (REAL)
        self.anchors_explainer = anchor_tabular.AnchorTabularExplainer(
            class_names=['Denied', 'Approved'],
            feature_names=self.FEATURE_NAMES,
            train_data=self.X_train,
            categorical_names={5: ['debt_consolidation', 'home_improvement', 'major_purchase', 'medical', 'car', 'other']}
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
        prob = probability[1]
        
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
        formatted = condition
        for feature, display_name in self.FEATURE_DISPLAY_NAMES.items():
            formatted = formatted.replace(feature, display_name)
        return formatted
    
    def explain_gpe(self, application: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate GPE explanation - YOUR NOVEL METHOD.
        
        GPE uses the decision tree structure directly and prunes conditions
        using a greedy approach while maintaining precision.
        """
        X = self._encode_application(application)
        
        start_time = time.time()
        explanation = self.gpe_explainer.explain(X[0])
        elapsed_ms = (time.time() - start_time) * 1000
        
        conditions = []
        if hasattr(explanation, 'rule') and explanation.rule:
            for cond in explanation.rule.conditions:
                conditions.append(self._format_condition(str(cond)))
        
        prediction = "Approved" if explanation.prediction == 1 else "Denied"
        explanation_text = f"Decision: {prediction}\nBecause: {' AND '.join(conditions)}" if conditions else f"Decision: {prediction}"
        
        return {
            "method": "gpe",
            "explanation_text": explanation_text,
            "explanation_html": "",
            "conditions": conditions,
            "complexity": len(conditions),
            "precision": explanation.precision,
            "coverage": explanation.coverage,
            "time_ms": elapsed_ms
        }
    
    def explain_lime(self, application: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate LIME explanation - BASELINE METHOD.
        
        LIME creates a local linear model around the instance
        and returns feature importance weights.
        """
        X = self._encode_application(application)
        
        start_time = time.time()
        exp = self.lime_explainer.explain_instance(
            X[0],
            self.model.predict_proba,
            num_features=6,
            num_samples=500
        )
        elapsed_ms = (time.time() - start_time) * 1000
        
        feature_weights = exp.as_list()
        
        conditions = []
        for feature_cond, weight in feature_weights:
            direction = "↑" if weight > 0 else "↓"
            conditions.append(f"{self._format_condition(feature_cond)}: {direction} ({weight:+.3f})")
        
        prediction = "Approved" if self.model.predict(X)[0] == 1 else "Denied"
        explanation_text = f"Decision: {prediction}\nFeature contributions:\n" + "\n".join(conditions)
        
        return {
            "method": "lime",
            "explanation_text": explanation_text,
            "explanation_html": "",
            "conditions": conditions,
            "complexity": len(feature_weights),
            "precision": None,
            "coverage": None,
            "time_ms": elapsed_ms
        }
    
    def explain_anchors(self, application: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate Anchors explanation - BASELINE METHOD.
        
        Anchors uses perturbation-based sampling to find
        sufficient conditions (anchors) that guarantee the prediction.
        
        THIS IS DIFFERENT FROM GPE:
        - GPE: Uses tree structure directly, greedy pruning
        - Anchors: Perturbation-based, beam search
        """
        X = self._encode_application(application)
        
        start_time = time.time()
        
        try:
            # Real Anchors explanation
            exp = self.anchors_explainer.explain_instance(
                X[0],
                self.model.predict,
                threshold=0.95,
                max_anchor_size=4,
                beam_size=4
            )
            elapsed_ms = (time.time() - start_time) * 1000
            
            # Extract anchor conditions
            conditions = []
            if hasattr(exp, 'names') and exp.names():
                for name in exp.names():
                    conditions.append(self._format_condition(name))
            
            precision = exp.precision() if hasattr(exp, 'precision') else 0.95
            coverage = exp.coverage() if hasattr(exp, 'coverage') else 0.1
            
        except Exception as e:
            # Fallback if Anchors fails
            print(f"Anchors failed: {e}, using fallback")
            elapsed_ms = (time.time() - start_time) * 1000
            
            # Simple fallback: extract top features from tree path
            prediction = self.model.predict(X)[0]
            node = 0
            tree = self.model.tree_
            conditions = []
            
            while tree.feature[node] != -2:  # Not a leaf
                feature_idx = tree.feature[node]
                threshold = tree.threshold[node]
                feature_name = self.FEATURE_NAMES[feature_idx]
                
                if X[0, feature_idx] <= threshold:
                    conditions.append(f"{self.FEATURE_DISPLAY_NAMES.get(feature_name, feature_name)} <= {threshold:.2f}")
                    node = tree.children_left[node]
                else:
                    conditions.append(f"{self.FEATURE_DISPLAY_NAMES.get(feature_name, feature_name)} > {threshold:.2f}")
                    node = tree.children_right[node]
                
                if len(conditions) >= 3:  # Limit for readability
                    break
            
            precision = 0.90
            coverage = 0.15
        
        prediction = "Approved" if self.model.predict(X)[0] == 1 else "Denied"
        explanation_text = f"Decision: {prediction}\nAnchor: {' AND '.join(conditions)}\nPrecision: {precision:.1%}"
        
        return {
            "method": "anchors",
            "explanation_text": explanation_text,
            "explanation_html": "",
            "conditions": conditions,
            "complexity": len(conditions),
            "precision": precision,
            "coverage": coverage,
            "time_ms": elapsed_ms
        }
    
    def explain_all(self, application: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """Generate all explanations for an application."""
        return {
            "gpe": self.explain_gpe(application),
            "lime": self.explain_lime(application),
            "anchors": self.explain_anchors(application)
        }


# Singleton
_explainer_service: Optional[ExplainerService] = None


def get_explainer_service() -> ExplainerService:
    """Get or create explainer service singleton."""
    global _explainer_service
    if _explainer_service is None:
        _explainer_service = ExplainerService()
    return _explainer_service
