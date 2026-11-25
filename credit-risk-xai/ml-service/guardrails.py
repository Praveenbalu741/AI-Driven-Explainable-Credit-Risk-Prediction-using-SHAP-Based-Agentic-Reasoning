import re
from typing import Dict, Any, List, Tuple

# Prohibited sensitive attributes to prevent bias and ensure fair lending regulations (ECOA / FCRA)
PROTECTED_ATTRIBUTES = ['race', 'gender', 'sex', 'religion', 'ethnicity', 'marital_status', 'age', 'sexual_orientation']

# Known prompt injection signatures in free-text loan notes
PROMPT_INJECTION_PATTERNS = [
    r'ignore\s+all\s+(previous|prior)\s+instructions',
    r'disregard\s+the\s+above',
    r'override\s+system\s+prompt',
    r'you\s+are\s+now\s+in\s+developer\s+mode',
    r'approve\s+this\s+loan\s+unconditionally',
    r'set\s+risk\s+to\s+zero',
    r'act\s+as\s+an\s+unrestricted\s+ai',
    r'<script>',
    r'\{\{.*\}\}',
    r'exec\s*\(',
    r'drop\s+table',
    r'system:\s*you\s+must'
]

# Bound constraints for financial plausibility
NUMERIC_BOUNDS = {
    'annual_income': (1000.0, 5000000.0),
    'loan_amount': (500.0, 500000.0),
    'term_months': (12, 120),
    'interest_rate': (1.0, 45.0),
    'installment': (10.0, 50000.0),
    'dti': (0.0, 150.0),
    'revolving_utilization': (0.0, 200.0),
    'credit_score': (300, 850),
    'credit_history_years': (0.1, 80.0),
    'open_credit_lines': (0, 100),
    'delinquencies_2yrs': (0, 30),
    'recent_inquiries': (0, 30),
    'employment_years': (0.0, 60.0)
}

def validate_input_bounds(applicant_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """Validates that input features fall within plausible economic ranges."""
    anomalies = []
    for feat, (low, high) in NUMERIC_BOUNDS.items():
        if feat in applicant_data and applicant_data[feat] is not None:
            try:
                val = float(applicant_data[feat])
                if val < low or val > high:
                    anomalies.append(f"Feature '{feat}' value {val} is out of realistic operational bounds [{low}, {high}]")
            except (ValueError, TypeError):
                anomalies.append(f"Feature '{feat}' has non-numeric value: {applicant_data[feat]}")
                
    # Check for presence of prohibited protected attributes
    for prot in PROTECTED_ATTRIBUTES:
        if prot in applicant_data:
            anomalies.append(f"Prohibited protected attribute detected: '{prot}'. Rejected for Fair Lending compliance.")
            
    is_valid = len(anomalies) == 0
    return is_valid, anomalies

def mask_pii(text: str) -> str:
    """Masks SSN, phone numbers, email addresses, and credit card patterns in free text."""
    if not text or not isinstance(text, str):
        return ""
    # SSN: ###-##-####
    text = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[REDACTED_SSN]', text)
    # Phone numbers: (###) ###-#### or ###-###-####
    text = re.sub(r'\(?\b\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b', '[REDACTED_PHONE]', text)
    # Email addresses
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[REDACTED_EMAIL]', text)
    # Card numbers
    text = re.sub(r'\b(?:\d{4}[ -]?){3}\d{4}\b', '[REDACTED_CARD]', text)
    return text

def detect_prompt_injection(text: str) -> Tuple[bool, str]:
    """Detects adversarial injection attacks aimed at manipulating the AI agent."""
    if not text or not isinstance(text, str):
        return False, ""
    lower_text = text.lower()
    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, lower_text):
            return True, f"Triggered adversarial safety rule: '{pattern}'"
    return False, ""

def run_guardrails_check(applicant_data: Dict[str, Any], notes: str = "") -> Dict[str, Any]:
    """
    Executes complete pre-underwriting guardrails check:
    1. Input bounds & protected attribute validation
    2. PII masking on applicant notes
    3. Prompt injection detection
    4. Out-of-distribution (OOD) routing
    """
    valid_bounds, bound_errors = validate_input_bounds(applicant_data)
    sanitized_notes = mask_pii(notes)
    is_injection, injection_reason = detect_prompt_injection(notes)
    
    requires_manual_review = False
    reasons = []
    
    if not valid_bounds:
        requires_manual_review = True
        reasons.extend(bound_errors)
        
    if is_injection:
        requires_manual_review = True
        reasons.append(f"Prompt injection detected in notes: {injection_reason}")
        
    # Check extreme financial leverage (OOD flag)
    income = float(applicant_data.get('annual_income', 50000))
    loan = float(applicant_data.get('loan_amount', 10000))
    dti = float(applicant_data.get('dti', 20.0))
    if income > 0 and (loan / income) > 1.2:
        requires_manual_review = True
        reasons.append(f"Extreme leverage ratio ({round(loan/income, 2)}x income) exceeds statistical modeling distribution")
    if dti > 70.0:
        requires_manual_review = True
        reasons.append(f"Extremely high DTI ({dti}%) routed to Senior Underwriter Review")

    return {
        "passed": not requires_manual_review,
        "requires_manual_review": requires_manual_review,
        "reasons": reasons,
        "sanitized_notes": sanitized_notes,
        "injection_detected": is_injection
    }
