"""
Deterministic Credit Underwriting Policy Engine.
Version: POL-2026.1
All policy rules are explicit, versioned, transparent, and auditable.
"""

from typing import Dict, Any, List

POLICY_VERSION = "POL-2026.1"

# Hard underwriting policy clauses with institutional thresholds
POLICY_RULES = [
    {
        "id": "POL-DTI-01",
        "name": "Maximum Debt-to-Income Ratio",
        "description": "Debt-to-Income (DTI) ratio must not exceed 43.0% (QM lending threshold)",
        "feature": "dti",
        "operator": "<=",
        "threshold": 43.0,
        "severity": "CRITICAL"
    },
    {
        "id": "POL-CS-02",
        "name": "Minimum Credit Score Floor",
        "description": "Applicant FICO credit score must be at or above 600",
        "feature": "credit_score",
        "operator": ">=",
        "threshold": 600,
        "severity": "CRITICAL"
    },
    {
        "id": "POL-DELINQ-03",
        "name": "Delinquency Recency Threshold",
        "description": "No more than 1 delinquency event in the past 24 months",
        "feature": "delinquencies_2yrs",
        "operator": "<=",
        "threshold": 1,
        "severity": "MAJOR"
    },
    {
        "id": "POL-LTI-04",
        "name": "Loan-to-Income Exposure Cap",
        "description": "Requested loan amount should not exceed 50% of annual gross income",
        "feature": "loan_to_income",
        "operator": "<=",
        "threshold": 0.50,
        "severity": "MAJOR"
    },
    {
        "id": "POL-UTIL-05",
        "name": "Revolving Credit Line Utilization Cap",
        "description": "Revolving line utilization should remain below 80.0%",
        "feature": "revolving_utilization",
        "operator": "<=",
        "threshold": 80.0,
        "severity": "MODERATE"
    },
    {
        "id": "POL-INQ-06",
        "name": "Velocity of Recent Credit Inquiries",
        "description": "Excessive recent credit inquiries (greater than 3) signal credit distress",
        "feature": "recent_inquiries",
        "operator": "<=",
        "threshold": 3,
        "severity": "MODERATE"
    }
]

def evaluate_policy_compliance(applicant: Dict[str, Any], custom_thresholds: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Evaluates applicant metrics against underwriting policies.
    Returns checklist results and overall policy verdict.
    """
    clauses = []
    failed_clauses = []
    
    thresholds = {
        'dti_cap': 43.0,
        'min_credit_score': 600,
        'max_delinquencies': 1,
        'max_loan_to_income': 0.50,
        'max_utilization': 80.0,
        'max_inquiries': 3
    }
    if custom_thresholds:
        thresholds.update(custom_thresholds)
        
    for rule in POLICY_RULES:
        feat = rule['feature']
        val = applicant.get(feat, 0.0)
        
        # Override threshold if custom provided
        thresh = rule['threshold']
        if feat == 'dti' and 'dti_cap' in thresholds: thresh = float(thresholds['dti_cap'])
        elif feat == 'credit_score' and 'min_credit_score' in thresholds: thresh = float(thresholds['min_credit_score'])
        elif feat == 'delinquencies_2yrs' and 'max_delinquencies' in thresholds: thresh = float(thresholds['max_delinquencies'])
        elif feat == 'loan_to_income' and 'max_loan_to_income' in thresholds: thresh = float(thresholds['max_loan_to_income'])
        elif feat == 'revolving_utilization' and 'max_utilization' in thresholds: thresh = float(thresholds['max_utilization'])
        elif feat == 'recent_inquiries' and 'max_inquiries' in thresholds: thresh = float(thresholds['max_inquiries'])
        
        passed = False
        if rule['operator'] == '<=':
            passed = bool(val <= thresh)
        elif rule['operator'] == '>=':
            passed = bool(val >= thresh)
            
        clause_result = {
            "clause_id": rule['id'],
            "name": rule['name'],
            "feature": feat,
            "actual_value": round(float(val), 2),
            "threshold": thresh,
            "condition": f"{rule['operator']} {thresh}",
            "passed": passed,
            "severity": rule['severity'],
            "description": rule['description']
        }
        clauses.append(clause_result)
        if not passed:
            failed_clauses.append(clause_result)
            
    is_compliant = len(failed_clauses) == 0
    verdict = "COMPLIANT" if is_compliant else ("MANUAL_REVIEW" if any(c['severity'] == 'CRITICAL' for c in failed_clauses) else "CONDITIONAL_APPROVAL")
    
    return {
        "policy_version": POLICY_VERSION,
        "is_compliant": is_compliant,
        "verdict": verdict,
        "total_checks": len(clauses),
        "passed_checks": len(clauses) - len(failed_clauses),
        "failed_checks": len(failed_clauses),
        "clauses": clauses,
        "failed_clauses": failed_clauses
    }
