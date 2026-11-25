import os
import numpy as np
import pandas as pd

def generate_synthetic_lending_data(n_samples=10000, random_seed=42):
    """
    Generates a realistic lending dataset of 10,000 applicants with 14 features:
    annual_income, loan_amount, term_months, interest_rate, installment, dti,
    revolving_utilization, credit_score, credit_history_years, open_credit_lines,
    delinquencies_2yrs, recent_inquiries, employment_years, home_ownership.
    Derived: loan_to_income, installment_to_income.
    Target: default (0 = paid/good, 1 = default/charge-off).
    """
    np.random.seed(random_seed)
    
    annual_income = np.random.lognormal(mean=11.1, sigma=0.55, size=n_samples) # ~$40k to $150k+
    annual_income = np.clip(annual_income, 18000, 350000).round(-2)
    
    loan_amount = np.random.choice(
        [3000, 5000, 7500, 10000, 12000, 15000, 18000, 20000, 25000, 30000, 35000, 40000],
        p=[0.05, 0.08, 0.10, 0.15, 0.12, 0.15, 0.10, 0.10, 0.07, 0.04, 0.02, 0.02],
        size=n_samples
    )
    
    term_months = np.random.choice([36, 60], p=[0.72, 0.28], size=n_samples)
    
    credit_score = np.random.normal(loc=685, scale=55, size=n_samples).astype(int)
    credit_score = np.clip(credit_score, 450, 850)
    
    # Interest rate is inversely related to credit score with random noise
    base_rate = 28.0 - ((credit_score - 450) / (850 - 450)) * 22.0
    interest_rate = base_rate + np.random.normal(0, 1.8, size=n_samples)
    interest_rate = np.clip(interest_rate, 5.0, 32.0).round(2)
    
    # Standard monthly amortization installment formula: P * (r*(1+r)^n) / ((1+r)^n - 1)
    monthly_r = (interest_rate / 100.0) / 12.0
    installment = loan_amount * (monthly_r * ((1 + monthly_r) ** term_months)) / (((1 + monthly_r) ** term_months) - 1)
    installment = installment.round(2)
    
    dti = np.random.beta(a=2.5, b=5.0, size=n_samples) * 55.0
    dti = np.clip(dti, 2.0, 58.0).round(2)
    
    revolving_utilization = np.random.beta(a=3.0, b=3.5, size=n_samples) * 100.0
    revolving_utilization = np.clip(revolving_utilization, 0.5, 99.5).round(1)
    
    credit_history_years = np.random.gamma(shape=3.5, scale=3.5, size=n_samples)
    credit_history_years = np.clip(credit_history_years, 1.0, 40.0).round(1)
    
    open_credit_lines = np.random.poisson(lam=11, size=n_samples)
    open_credit_lines = np.clip(open_credit_lines, 1, 35)
    
    delinquencies_2yrs = np.random.choice([0, 1, 2, 3, 4, 5], p=[0.78, 0.13, 0.05, 0.02, 0.01, 0.01], size=n_samples)
    recent_inquiries = np.random.choice([0, 1, 2, 3, 4, 5], p=[0.55, 0.25, 0.12, 0.05, 0.02, 0.01], size=n_samples)
    
    employment_years = np.random.choice(
        [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        p=[0.06, 0.08, 0.09, 0.10, 0.09, 0.09, 0.08, 0.07, 0.06, 0.06, 0.22],
        size=n_samples
    )
    
    home_ownership = np.random.choice(['RENT', 'MORTGAGE', 'OWN'], p=[0.42, 0.48, 0.10], size=n_samples)
    
    # Derived features
    loan_to_income = (loan_amount / annual_income).round(4)
    installment_to_income = ((installment * 12.0) / annual_income).round(4)
    
    # Construct realistic latent risk score log-odds for default
    # Higher score = higher probability of default
    z = (
        -2.4
        + 0.045 * (dti - 20.0)
        + 0.025 * (revolving_utilization - 45.0)
        - 0.018 * (credit_score - 680)
        + 0.065 * (interest_rate - 12.0)
        + 0.55 * delinquencies_2yrs
        + 0.32 * recent_inquiries
        + 1.8 * (loan_to_income - 0.25)
        - 0.04 * (credit_history_years - 10.0)
        - 0.03 * (employment_years - 5.0)
        + (0.25 if 'RENT' else -0.15)
        + np.random.normal(0, 0.4, size=n_samples)
    )
    
    prob_default = 1.0 / (1.0 + np.exp(-z))
    default = (np.random.uniform(0, 1, size=n_samples) < prob_default).astype(int)
    
    df = pd.DataFrame({
        'annual_income': annual_income,
        'loan_amount': loan_amount,
        'term_months': term_months,
        'interest_rate': interest_rate,
        'installment': installment,
        'dti': dti,
        'revolving_utilization': revolving_utilization,
        'credit_score': credit_score,
        'credit_history_years': credit_history_years,
        'open_credit_lines': open_credit_lines,
        'delinquencies_2yrs': delinquencies_2yrs,
        'recent_inquiries': recent_inquiries,
        'employment_years': employment_years,
        'home_ownership': home_ownership,
        'loan_to_income': loan_to_income,
        'installment_to_income': installment_to_income,
        'default': default
    })
    
    return df

def generate_german_credit_subset(n_samples=1000):
    """Generates German credit benchmarking format mapping to our 14 core features."""
    df = generate_synthetic_lending_data(n_samples=n_samples, random_seed=123)
    return df

if __name__ == '__main__':
    data_dir = os.path.dirname(os.path.abspath(__file__))
    out_file = os.path.join(data_dir, 'lending_club_synthetic_10k.csv')
    german_file = os.path.join(data_dir, 'german_credit_benchmark.csv')
    
    print(f"Generating 10,000 synthetic lending records...")
    df = generate_synthetic_lending_data(10000)
    df.to_csv(out_file, index=False)
    print(f"Saved: {out_file} (Default rate: {df['default'].mean():.2%})")
    
    print(f"Generating German credit benchmark dataset...")
    df_german = generate_german_credit_subset(1000)
    df_german.to_csv(german_file, index=False)
    print(f"Saved: {german_file}")
