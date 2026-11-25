import numpy as np
import pandas as pd
from typing import Dict, Any, List

# Core features used in the credit risk underwriting model
NUMERIC_FEATURES = [
    'annual_income',
    'loan_amount',
    'term_months',
    'interest_rate',
    'installment',
    'dti',
    'revolving_utilization',
    'credit_score',
    'credit_history_years',
    'open_credit_lines',
    'delinquencies_2yrs',
    'recent_inquiries',
    'employment_years',
    'loan_to_income',
    'installment_to_income'
]

CATEGORICAL_FEATURES = [
    'home_ownership'
]

ALL_MODEL_FEATURES = [
    'annual_income',
    'loan_amount',
    'term_months',
    'interest_rate',
    'installment',
    'dti',
    'revolving_utilization',
    'credit_score',
    'credit_history_years',
    'open_credit_lines',
    'delinquencies_2yrs',
    'recent_inquiries',
    'employment_years',
    'home_ownership_MORTGAGE',
    'home_ownership_OWN',
    'home_ownership_RENT',
    'loan_to_income',
    'installment_to_income'
]

# Mutability definition for counterfactual analysis and what-if exploration
MUTABLE_FEATURES = ['dti', 'revolving_utilization', 'loan_amount', 'term_months']
IMMUTABLE_FEATURES = ['credit_score', 'credit_history_years', 'delinquencies_2yrs', 'recent_inquiries', 'employment_years', 'annual_income']

FEATURE_LABELS = {
    'annual_income': 'Annual Income ($)',
    'loan_amount': 'Requested Loan Amount ($)',
    'term_months': 'Loan Term (Months)',
    'interest_rate': 'Interest Rate (%)',
    'installment': 'Monthly Installment ($)',
    'dti': 'Debt-to-Income Ratio (%)',
    'revolving_utilization': 'Revolving Line Utilization (%)',
    'credit_score': 'FICO Credit Score',
    'credit_history_years': 'Credit History Length (Years)',
    'open_credit_lines': 'Open Credit Lines',
    'delinquencies_2yrs': 'Delinquencies in Past 2 Years',
    'recent_inquiries': 'Recent Credit Inquiries (6 Mo)',
    'employment_years': 'Employment Stability (Years)',
    'home_ownership_MORTGAGE': 'Home Ownership: Mortgage',
    'home_ownership_OWN': 'Home Ownership: Own',
    'home_ownership_RENT': 'Home Ownership: Rent',
    'loan_to_income': 'Loan-to-Income Ratio',
    'installment_to_income': 'Installment Burden Ratio'
}

def compute_derived_features(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes derived economic ratios:
    - loan_to_income = loan_amount / annual_income
    - installment_to_income = (installment * 12) / annual_income
    - installment (if not provided, computed from standard amortization)
    """
    d = dict(data)
    loan_amt = float(d.get('loan_amount', 10000))
    ann_income = max(float(d.get('annual_income', 50000)), 1.0)
    int_rate = float(d.get('interest_rate', 12.0))
    term = int(d.get('term_months', 36))
    
    # Calculate monthly installment if missing or 0
    if not d.get('installment') or float(d.get('installment')) <= 0:
        monthly_r = (int_rate / 100.0) / 12.0
        if monthly_r > 0:
            installment = loan_amt * (monthly_r * ((1 + monthly_r) ** term)) / (((1 + monthly_r) ** term) - 1)
        else:
            installment = loan_amt / term
        d['installment'] = round(installment, 2)
    else:
        d['installment'] = float(d['installment'])
        
    d['loan_to_income'] = round(loan_amt / ann_income, 4)
    d['installment_to_income'] = round((d['installment'] * 12.0) / ann_income, 4)
    return d

def preprocess_single_record(record: Dict[str, Any], imputers: Dict[str, float] = None) -> pd.DataFrame:
    """Preprocesses a single applicant dictionary into an aligned feature DataFrame."""
    record_derived = compute_derived_features(record)
    row = {}
    
    # 1. Numeric features + imputation
    for feat in NUMERIC_FEATURES:
        val = record_derived.get(feat)
        if val is None or (isinstance(val, (float, int)) and np.isnan(val)):
            val = imputers.get(feat, 0.0) if imputers else 0.0
        row[feat] = float(val)
        
    # 2. One-hot encoding for home_ownership (RENT, OWN, MORTGAGE)
    home_val = str(record_derived.get('home_ownership', 'RENT')).upper().strip()
    row['home_ownership_MORTGAGE'] = 1.0 if home_val == 'MORTGAGE' else 0.0
    row['home_ownership_OWN'] = 1.0 if home_val == 'OWN' else 0.0
    row['home_ownership_RENT'] = 1.0 if home_val == 'RENT' else 0.0
    
    # Create DataFrame in exact feature order
    df = pd.DataFrame([row])[ALL_MODEL_FEATURES]
    return df

def preprocess_dataframe(df_raw: pd.DataFrame, imputers: Dict[str, float] = None, fit: bool = False):
    """
    Preprocesses a batch DataFrame of records.
    Returns (X_df, imputers_dict).
    """
    df = df_raw.copy()
    
    # Ensure derived features
    if 'loan_to_income' not in df.columns:
        df['loan_to_income'] = (df['loan_amount'] / df['annual_income'].clip(lower=1.0)).round(4)
    if 'installment_to_income' not in df.columns:
        df['installment_to_income'] = ((df['installment'] * 12.0) / df['annual_income'].clip(lower=1.0)).round(4)
        
    if fit:
        imputers = {}
        for feat in NUMERIC_FEATURES:
            median_val = float(df[feat].median())
            imputers[feat] = median_val
            df[feat] = df[feat].fillna(median_val)
    else:
        if imputers:
            for feat in NUMERIC_FEATURES:
                if feat in df.columns:
                    df[feat] = df[feat].fillna(imputers.get(feat, 0.0))
                    
    # Categorical encoding
    home = df['home_ownership'].astype(str).str.upper().str.strip()
    df['home_ownership_MORTGAGE'] = (home == 'MORTGAGE').astype(float)
    df['home_ownership_OWN'] = (home == 'OWN').astype(float)
    df['home_ownership_RENT'] = (home == 'RENT').astype(float)
    
    X = df[ALL_MODEL_FEATURES]
    return X, imputers
