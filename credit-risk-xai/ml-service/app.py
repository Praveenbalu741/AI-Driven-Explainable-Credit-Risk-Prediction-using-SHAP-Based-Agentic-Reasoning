"""
FastAPI Microservice for AI-Driven Explainable Credit Risk Prediction.
Endpoints:
  - POST /predict: Predicts Probability of Default (PD) and risk tier
  - POST /explain: Computes local TreeSHAP explanations with additivity check
  - POST /counterfactual: Generates actionable constrained recourse
  - POST /assess: Full pipeline (Guardrails -> ML -> SHAP -> Policy -> Agent Reasoning)
  - POST /batch: Batch CSV scoring and portfolio analytics
  - GET /metrics: ROC curve, model comparison (Logistic vs XGBoost vs LightGBM), latencies
  - GET /global-importance: Global feature attribution rankings
  - GET /health: Health check and model readiness status
"""

import os
import io
import time
import joblib
import pandas as pd
from typing import Dict, Any, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from preprocessing import preprocess_single_record, compute_derived_features, preprocess_dataframe
from shap_engine import ShapExplanationEngine
from policy import evaluate_policy_compliance
from counterfactual import generate_counterfactual_recourse
from guardrails import run_guardrails_check
from agent import generate_underwriting_memo
from train import train_and_evaluate, BUNDLE_FILE

# Global model state
bundle = None
shap_engine = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global bundle, shap_engine
    if not os.path.exists(BUNDLE_FILE):
        print(f"Model bundle not found. Training model automatically on startup...")
        bundle = train_and_evaluate()
    else:
        print(f"Loading existing model bundle from {BUNDLE_FILE}...")
        bundle = joblib.load(BUNDLE_FILE)
        
    print("Initializing TreeSHAP explanation engine...")
    shap_engine = ShapExplanationEngine(bundle['champion_model'], bundle['shap_background'])
    print(f"ML Service initialized successfully with model version: {bundle['version']}")
    yield

app = FastAPI(
    title="AI-Driven Explainable Credit Risk Microservice",
    description="TreeSHAP-grounded credit risk prediction and agentic reasoning API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ApplicantInput(BaseModel):
    annual_income: float = Field(..., ge=1000.0, description="Gross annual income in USD")
    loan_amount: float = Field(..., ge=500.0, description="Requested principal amount in USD")
    term_months: int = Field(36, description="Loan term in months (36 or 60)")
    interest_rate: float = Field(12.5, description="Annual interest rate percentage")
    installment: Optional[float] = Field(None, description="Monthly installment in USD")
    dti: float = Field(..., ge=0.0, description="Debt-to-income ratio percentage")
    revolving_utilization: float = Field(..., ge=0.0, description="Revolving credit line utilization percentage")
    credit_score: int = Field(..., ge=300, le=850, description="FICO credit score")
    credit_history_years: float = Field(..., ge=0.0, description="Length of credit history in years")
    open_credit_lines: int = Field(10, ge=0, description="Number of open credit accounts")
    delinquencies_2yrs: int = Field(0, ge=0, description="Delinquencies in the past 2 years")
    recent_inquiries: int = Field(0, ge=0, description="Credit inquiries in the past 6 months")
    employment_years: float = Field(5.0, ge=0.0, description="Years in current employment")
    home_ownership: str = Field("RENT", description="Home ownership: RENT, MORTGAGE, OWN")
    notes: Optional[str] = Field("", description="Optional loan officer notes or free-text narrative")
    applicant_name: Optional[str] = Field("Applicant", description="Applicant identifier or name")

def get_risk_band(pd_score: float, thresholds: Dict[str, float]) -> str:
    low_th = thresholds.get("low", 0.25)
    mod_th = thresholds.get("moderate", 0.50)
    if pd_score < low_th:
        return "Low"
    elif pd_score < mod_th:
        return "Moderate"
    else:
        return "High"

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "credit-risk-xai-ml-service",
        "model_version": bundle['version'] if bundle else "NOT_LOADED",
        "timestamp": time.time()
    }

@app.get("/metrics")
def get_metrics():
    if not bundle:
        raise HTTPException(status_code=503, detail="Model bundle not loaded")
    return {
        "model_version": bundle['version'],
        "metrics": bundle['metrics'],
        "risk_thresholds": bundle['risk_thresholds'],
        "trained_at": bundle.get('trained_at')
    }

@app.get("/global-importance")
def get_global_importance():
    if not bundle:
        raise HTTPException(status_code=503, detail="Model bundle not loaded")
    return {
        "model_version": bundle['version'],
        "global_importance": bundle['global_importance']
    }

@app.post("/predict")
def predict_risk(applicant: ApplicantInput):
    applicant_dict = applicant.model_dump()
    X_df = preprocess_single_record(applicant_dict, bundle['imputers'])
    
    # Predict calibrated probability of default
    prob = float(bundle['calibrated_model'].predict_proba(X_df)[0, 1])
    risk_band = get_risk_band(prob, bundle['risk_thresholds'])
    
    return {
        "probability_of_default": round(prob, 4),
        "pd_percentage": f"{round(prob * 100, 2)}%",
        "risk_band": risk_band,
        "model_version": bundle['version']
    }

@app.post("/explain")
def explain_applicant(applicant: ApplicantInput):
    applicant_dict = applicant.model_dump()
    X_df = preprocess_single_record(applicant_dict, bundle['imputers'])
    shap_results = shap_engine.explain_instance(X_df, top_k=5)
    
    return {
        "shap_explanation": shap_results,
        "model_version": bundle['version']
    }

@app.post("/counterfactual")
def get_counterfactual(applicant: ApplicantInput):
    applicant_dict = applicant.model_dump()
    cf_results = generate_counterfactual_recourse(
        applicant_dict,
        bundle['calibrated_model'],
        bundle['imputers'],
        target_pd=0.24
    )
    return cf_results

@app.post("/assess")
def full_assessment(applicant: ApplicantInput):
    t0 = time.time()
    applicant_dict = applicant.model_dump()
    notes = applicant_dict.get('notes', '')
    
    # 1. Guardrails & Validation
    guardrail_res = run_guardrails_check(applicant_dict, notes)
    
    # 2. Derived features & Preprocessing
    derived = compute_derived_features(applicant_dict)
    X_df = preprocess_single_record(derived, bundle['imputers'])
    
    # 3. Model Prediction
    calibrated_pd = float(bundle['calibrated_model'].predict_proba(X_df)[0, 1])
    risk_band = get_risk_band(calibrated_pd, bundle['risk_thresholds'])
    
    # 4. TreeSHAP Local Explanation
    shap_res = shap_engine.explain_instance(X_df, top_k=5)
    
    # 5. Underwriting Policy Compliance
    policy_res = evaluate_policy_compliance(derived)
    
    # 6. Counterfactual Recourse
    cf_res = generate_counterfactual_recourse(
        derived,
        bundle['calibrated_model'],
        bundle['imputers'],
        target_pd=bundle['risk_thresholds']['low'] - 0.01
    )
    
    # 7. Agentic Underwriting Memo with Numeric Grounding Verification
    llm_provider = os.getenv("LLM_PROVIDER", "template")
    memo_res = generate_underwriting_memo(
        derived,
        shap_res,
        policy_res,
        cf_res,
        risk_band,
        calibrated_pd,
        provider=llm_provider
    )
    
    latency_ms = round((time.time() - t0) * 1000, 2)
    
    return {
        "applicant": derived,
        "probability_of_default": round(calibrated_pd, 4),
        "pd_percentage": f"{round(calibrated_pd * 100, 2)}%",
        "risk_band": risk_band,
        "guardrails": guardrail_res,
        "shap_explanation": shap_res,
        "policy": policy_res,
        "counterfactual": cf_res,
        "underwriting_memo": memo_res,
        "model_version": bundle['version'],
        "latency_ms": latency_ms
    }

@app.post("/batch")
async def batch_assessment(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
        
    content = await file.read()
    try:
        df_batch = pd.read_csv(io.StringIO(content.decode('utf-8')))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")
        
    X_batch, _ = preprocess_dataframe(df_batch, imputers=bundle['imputers'], fit=False)
    
    # Predict probabilities
    probs = bundle['calibrated_model'].predict_proba(X_batch)[:, 1]
    
    results = []
    band_counts = {"Low": 0, "Moderate": 0, "High": 0}
    
    for i, p in enumerate(probs):
        band = get_risk_band(p, bundle['risk_thresholds'])
        band_counts[band] += 1
        row_id = df_batch.iloc[i].get('id', f"APPL-{1000+i}")
        results.append({
            "applicant_id": str(row_id),
            "probability_of_default": round(float(p), 4),
            "pd_percentage": f"{round(float(p)*100, 2)}%",
            "risk_band": band,
            "credit_score": int(df_batch.iloc[i].get('credit_score', 0)),
            "annual_income": float(df_batch.iloc[i].get('annual_income', 0)),
            "loan_amount": float(df_batch.iloc[i].get('loan_amount', 0)),
            "dti": float(df_batch.iloc[i].get('dti', 0))
        })
        
    total = len(results)
    avg_pd = round(float(probs.mean()), 4) if total > 0 else 0
    approval_rate = round(float(band_counts['Low'] / total), 4) if total > 0 else 0
    
    return {
        "total_records": total,
        "average_pd": avg_pd,
        "approval_rate": approval_rate,
        "distribution": band_counts,
        "model_version": bundle['version'],
        "records": results
    }
