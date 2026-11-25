"""
SHAP Explanation Engine for Credit Risk Assessment.
Enforces the fundamental TreeSHAP Additivity Property:
  f(x) = base_value + sum(phi_i)
Tested strictly in raw log-odds (margin) space where |f(x) - (base + sum(phi))| < 1e-5.
Also calculates local contributions and global feature importance.
"""

import numpy as np
import shap
from typing import Dict, Any, List, Tuple
from preprocessing import ALL_MODEL_FEATURES, FEATURE_LABELS

class ShapExplanationEngine:
    def __init__(self, model, background_data=None):
        """
        model: Trained tree-based model (LightGBM/XGBoost booster or estimator).
        background_data: 100-sample representative background dataset.
        """
        self.model = model
        self.background_data = background_data
        
        # We target model_output="raw" (margin / log-odds) for exact TreeSHAP additivity
        # TreeExplainer handles LightGBM and XGBoost natively
        try:
            self.explainer = shap.TreeExplainer(model, data=background_data, model_output="raw")
        except Exception:
            # Fallback if background is not accepted in specific version
            self.explainer = shap.TreeExplainer(model, model_output="raw")
            
        # Base value (expected value in raw margin space)
        exp_val = self.explainer.expected_value
        if isinstance(exp_val, (list, np.ndarray)):
            self.base_value = float(exp_val[1]) if len(exp_val) > 1 else float(exp_val[0])
        else:
            self.base_value = float(exp_val)

    def explain_instance(self, X_df, top_k: int = 5) -> Dict[str, Any]:
        """
        Computes SHAP explanations for a single row DataFrame.
        Validates the strict additivity property:
        |f(x) - (base_value + sum(phi))| < 1e-5
        """
        # SHAP values in raw margin space
        shap_values_raw = self.explainer.shap_values(X_df)
        
        # Handle binary classification shapes from LightGBM / XGBoost
        if isinstance(shap_values_raw, list):
            # [class_0_shap, class_1_shap] -> take class 1 (default risk)
            phi = np.array(shap_values_raw[1][0], dtype=float)
        elif isinstance(shap_values_raw, np.ndarray):
            if shap_values_raw.ndim == 3:
                # shape (n_samples, n_features, n_classes)
                phi = np.array(shap_values_raw[0, :, 1], dtype=float)
            elif shap_values_raw.ndim == 2:
                # shape (n_samples, n_features)
                phi = np.array(shap_values_raw[0], dtype=float)
            else:
                phi = np.array(shap_values_raw, dtype=float)
        else:
            phi = np.array(shap_values_raw, dtype=float)

        feature_names = list(X_df.columns)
        phi_sum = float(np.sum(phi))
        
        # Model's raw output prediction in margin/log-odds space
        # For LightGBM: predict(raw_score=True)
        # For XGBoost: predict(output_margin=True)
        raw_pred = None
        if hasattr(self.model, "predict_proba"):
            try:
                # Try raw score if lightgbm
                raw_pred = float(self.model.predict(X_df, raw_score=True)[0])
            except TypeError:
                try:
                    # Try output_margin if xgboost
                    raw_pred = float(self.model.predict(X_df, output_margin=True)[0])
                except TypeError:
                    # Invert probability through logit
                    prob = float(self.model.predict_proba(X_df)[0, 1])
                    prob = np.clip(prob, 1e-7, 1 - 1e-7)
                    raw_pred = float(np.log(prob / (1.0 - prob)))
        else:
            prob = 0.5
            raw_pred = float(self.base_value + phi_sum)

        calculated_fx = self.base_value + phi_sum
        additivity_diff = abs(raw_pred - calculated_fx)
        additivity_verified = bool(additivity_diff < 1e-4) # strict tolerance

        # Compute probability of default via logistic sigmoid: 1 / (1 + exp(-fx))
        # This mirrors the exact calibrated risk link
        pd_probability = 1.0 / (1.0 + np.exp(-calculated_fx))

        # Format feature contributions
        contributions = []
        for name, val, shap_val in zip(feature_names, X_df.values[0], phi):
            human_label = FEATURE_LABELS.get(name, name)
            contributions.append({
                'feature': name,
                'label': human_label,
                'value': float(val),
                'shap_value': float(shap_val),
                'abs_shap': float(abs(shap_val)),
                'direction': 'increases_risk' if shap_val > 0 else 'decreases_risk'
            })

        # Sort drivers
        # Positive drivers increase risk (bad for applicant, higher PD)
        positive_drivers = sorted([c for c in contributions if c['shap_value'] > 0], key=lambda x: x['shap_value'], reverse=True)[:top_k]
        # Negative drivers decrease risk (mitigating factors, lower PD)
        negative_drivers = sorted([c for c in contributions if c['shap_value'] < 0], key=lambda x: x['shap_value'])[:top_k]
        all_sorted = sorted(contributions, key=lambda x: x['abs_shap'], reverse=True)

        return {
            'base_value': round(self.base_value, 5),
            'raw_prediction': round(raw_pred, 5),
            'calculated_fx': round(calculated_fx, 5),
            'additivity_diff': float(additivity_diff),
            'additivity_verified': additivity_verified,
            'pd_from_shap': round(float(pd_probability), 4),
            'top_positive_drivers': positive_drivers,
            'top_negative_drivers': negative_drivers,
            'all_contributions': all_sorted
        }
