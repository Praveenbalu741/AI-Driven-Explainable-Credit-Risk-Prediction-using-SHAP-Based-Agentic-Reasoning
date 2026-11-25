"""
Counterfactual Recourse Generator for Credit Risk.
Constrained search strictly on MUTABLE features (dti, revolving_utilization, loan_amount, term_months).
Strictly locks immutable features (credit_history_years, delinquencies_2yrs, recent_inquiries, employment_years).
Finds minimal actionable changes to lower PD below target risk threshold (e.g., 0.24).
"""

import numpy as np
import copy
from typing import Dict, Any, List
from preprocessing import preprocess_single_record, compute_derived_features

TARGET_RISK_THRESHOLD = 0.24  # Target to get applicant into "Low Risk" band (< 0.25)

def generate_counterfactual_recourse(
    applicant_data: Dict[str, Any],
    model,
    imputers: Dict[str, float],
    target_pd: float = TARGET_RISK_THRESHOLD,
    max_steps: int = 15
) -> Dict[str, Any]:
    """
    Performs actionable constrained counterfactual search.
    Explores 3 realistic financial recourse levers:
      Lever 1: Pay down existing revolving debt (reduces revolving_utilization & dti)
      Lever 2: Adjust requested loan amount (reduces loan_amount & loan_to_income)
      Lever 3: Extend loan tenure (e.g. 36m -> 60m, reduces monthly installment & installment_to_income)
    """
    original = dict(applicant_data)
    
    # Calculate original PD
    orig_df = preprocess_single_record(original, imputers)
    orig_pd = float(model.predict_proba(orig_df)[0, 1])
    
    if orig_pd <= target_pd:
        return {
            "eligible_without_changes": True,
            "original_pd": round(orig_pd, 4),
            "target_pd": target_pd,
            "recourse_plans": [],
            "message": "Applicant already satisfies target probability of default threshold."
        }
        
    plans = []
    
    # --- Strategy A: Revolving Utilization & DTI Optimization ---
    curr_util = float(original.get('revolving_utilization', 50.0))
    curr_dti = float(original.get('dti', 30.0))
    
    best_candidate_a = None
    min_pd_a = orig_pd
    
    for step in range(1, max_steps + 1):
        test_data = copy.deepcopy(original)
        util_reduction = step * 4.0 # reduce utilization by 4% per step
        new_util = max(5.0, curr_util - util_reduction)
        # Reducing balance also reduces monthly debt payments and thus DTI
        dti_reduction = (curr_util - new_util) * 0.15
        new_dti = max(5.0, curr_dti - dti_reduction)
        
        test_data['revolving_utilization'] = round(new_util, 1)
        test_data['dti'] = round(new_dti, 2)
        
        sim_df = preprocess_single_record(test_data, imputers)
        sim_pd = float(model.predict_proba(sim_df)[0, 1])
        
        if sim_pd < min_pd_a:
            min_pd_a = sim_pd
            best_candidate_a = {
                "name": "Revolving Debt Paydown",
                "strategy": "Pay down outstanding credit card balances",
                "changes": [
                    {"feature": "revolving_utilization", "from": curr_util, "to": round(new_util, 1), "unit": "%"},
                    {"feature": "dti", "from": curr_dti, "to": round(new_dti, 2), "unit": "%"}
                ],
                "achieved_pd": round(sim_pd, 4),
                "reaches_target": sim_pd <= target_pd
            }
        if sim_pd <= target_pd:
            break
            
    if best_candidate_a:
        plans.append(best_candidate_a)
        
    # --- Strategy B: Principal Reduction ---
    curr_loan = float(original.get('loan_amount', 15000))
    best_candidate_b = None
    min_pd_b = orig_pd
    
    for pct in [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40]:
        test_data = copy.deepcopy(original)
        new_loan = round(curr_loan * (1.0 - pct), -2)
        test_data['loan_amount'] = new_loan
        test_data['installment'] = 0 # Force recalculation in preprocessing
        
        sim_df = preprocess_single_record(test_data, imputers)
        sim_pd = float(model.predict_proba(sim_df)[0, 1])
        
        if sim_pd < min_pd_b:
            min_pd_b = sim_pd
            best_candidate_b = {
                "name": "Loan Amount Downsizing",
                "strategy": f"Reduce requested loan principal by {int(pct*100)}%",
                "changes": [
                    {"feature": "loan_amount", "from": curr_loan, "to": new_loan, "unit": "$"},
                    {"feature": "loan_to_income", "from": round(curr_loan / original.get('annual_income', 50000), 2), "to": round(new_loan / original.get('annual_income', 50000), 2), "unit": "ratio"}
                ],
                "achieved_pd": round(sim_pd, 4),
                "reaches_target": sim_pd <= target_pd
            }
        if sim_pd <= target_pd:
            break
            
    if best_candidate_b:
        plans.append(best_candidate_b)
        
    # --- Strategy C: Hybrid Tenure Extension + Moderate Balance Reduction ---
    curr_term = int(original.get('term_months', 36))
    if curr_term == 36:
        test_data = copy.deepcopy(original)
        test_data['term_months'] = 60
        test_data['revolving_utilization'] = max(10.0, curr_util * 0.8)
        test_data['installment'] = 0
        
        sim_df = preprocess_single_record(test_data, imputers)
        sim_pd = float(model.predict_proba(sim_df)[0, 1])
        
        plans.append({
            "name": "Extended Loan Term & Moderate Debt Relief",
            "strategy": "Extend amortization term to 60 months and lower credit card utilization",
            "changes": [
                {"feature": "term_months", "from": 36, "to": 60, "unit": "months"},
                {"feature": "revolving_utilization", "from": curr_util, "to": round(test_data['revolving_utilization'], 1), "unit": "%"}
            ],
            "achieved_pd": round(sim_pd, 4),
            "reaches_target": sim_pd <= target_pd
        })
        
    return {
        "eligible_without_changes": False,
        "original_pd": round(orig_pd, 4),
        "target_pd": target_pd,
        "mutable_features_allowed": ["dti", "revolving_utilization", "loan_amount", "term_months"],
        "immutable_features_locked": ["credit_score", "credit_history_years", "delinquencies_2yrs", "recent_inquiries"],
        "recourse_plans": plans
    }
