# AI-Driven Explainable Credit Risk Prediction Using SHAP-Based Agentic Reasoning (CredXAI)

A demo-ready, bank-grade final-year capstone project bridging machine learning predictive power (LightGBM, XGBoost, Scikit-Learn) with regulatory explainability (TreeSHAP exact additivity, constrained counterfactual recourse) and agentic underwriting reasoning (anti-hallucination numeric grounding).

---

## 🏛️ System Architecture Overview

```
                                 ┌────────────────────────────────────────────────────────┐
                                 │                React 18 + Vite Frontend                │
                                 │   - Executive Dashboard & Global TreeSHAP Insights      │
                                 │   - Multi-Section Underwriting Assessment Form        │
                                 │   - SHAP Waterfall & Force Attribution Visualizer      │
                                 │   - Interactive What-If Counterfactual Simulator       │
                                 │   - Bank-Grade Compliance PDF Export                   │
                                 └───────────────────────────┬────────────────────────────┘
                                                             │ REST / JWT Auth
                                                             ▼
                                 ┌────────────────────────────────────────────────────────┐
                                 │            Node.js 20 + Express Governance API         │
                                 │   - RBAC Security (ADMIN, RISK_MANAGER, ANALYST)       │
                                 │   - Resilient FileStore / MongoDB Persistence Fallback │
                                 │   - Immutable Audit Logging & Policy Management        │
                                 │   - PDFKit Regulatory Compliance Document Engine       │
                                 └───────────────────────────┬────────────────────────────┘
                                                             │ HTTP Microservice RPC
                                                             ▼
                                 ┌────────────────────────────────────────────────────────┐
                                 │             Python 3.10+ FastAPI ML Microservice       │
                                 │   - ECOA/FCRA Fair Lending Guardrails & PII Sanitizer   │
                                 │   - Prompt Injection Shield for Underwriter Notes      │
                                 │   - Calibrated LightGBM (Champion) & XGBoost Baseline  │
                                 │   - TreeSHAP Explainer (|f(x) - (base + Σφ)| < 1e-4)   │
                                 │   - Constrained Counterfactual Recourse (Mutable Only) │
                                 │   - Agentic Reasoning with 100% Numeric Grounding Check│
                                 └────────────────────────────────────────────────────────┘
```

---

## ⚡ Key Highlights & Regulatory Innovations

1. **Exact TreeSHAP Additivity Verification**:
   - Evaluated in the tree ensemble's raw log-odds (margin) space where the fundamental Shapley efficiency axiom holds exactly:
     $$\left| f(x) - \left( \phi_0 + \sum_{i=1}^M \phi_i \right) \right| < 10^{-4}$$
   - Guarantees zero feature attribution leakage and zero unexplained model variance.
2. **Actionable Constrained Counterfactual Recourse**:
   - Explores only **MUTABLE** features: Debt-to-Income (`dti`), Revolving Utilization (`revolving_utilization`), Loan Amount (`loan_amount`), and Term (`term_months`).
   - Strictly locks **IMMUTABLE** historical attributes: `credit_score`, `credit_history_years`, `delinquencies_2yrs`, and `recent_inquiries`.
3. **Anti-Hallucination Numeric Grounding Verifier**:
   - Every monetary amount, percentage, and log-odds coefficient generated in the Four-Section Underwriting Memo is verified against mathematical ground truth. If grounding drops below 95%, it reverts to the verified deterministic template.
4. **Resilient Zero-Setup Architecture**:
   - If MongoDB is not running, the Governance API automatically falls back to an atomic, persistent JSON store in `server/data_storage/`.
   - The ML service uses a deterministic reasoning fallback by default, requiring **zero internet connection** and **zero API keys**. Supports Ollama, Anthropic, and OpenAI via `.env` configuration.

---

## 🚀 Step-by-Step Run Instructions

### Prerequisites
- **Python 3.10+** (Python 3.11 recommended)
- **Node.js 18+** or **20+** with `npm`

### One-Click Startup

#### On Windows:
Double-click `start-all.bat` or run in Command Prompt / PowerShell:
```cmd
start-all.bat
```

#### On Linux / macOS:
```bash
chmod +x start-all.sh
./start-all.sh
```

---

### Manual Step-by-Step Launch

#### 1. Setup and Launch the ML Microservice:
```bash
cd ml-service
# On Windows:
python -m venv venv
venv\Scripts\pip install -r requirements.txt
# Train champion model (auto-runs on startup if not present):
venv\Scripts\python train.py
# Run FastAPI server:
venv\Scripts\python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Launch the Express Governance API:
```bash
cd server
npm install
npm start
```

#### 3. Launch the React Client:
```bash
cd client
npm install
npm run dev
```

Open your browser at: **`http://localhost:5173`**

---

## 🔑 Demo Credentials (Role-Based Access Control)

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Chief Risk Officer (Admin)** | `admin@demo.com` | `Demo@123` | Full access: Underwriting, Model Governance, Audit Trail, Policy Covenants |
| **Risk Manager** | `manager@demo.com` | `Demo@123` | Portfolio Analytics, Audit Logs, Case Review |
| **Credit Analyst** | `analyst@demo.com` | `Demo@123` | New Assessments, What-If Simulator, PDF Generation |

*(Quick-fill buttons are provided on the login page for instant examiner demonstration)*

---

## 🧪 Automated Test Suite

Run the full validation suite (Valid Applicant, Out-of-Bounds Guardrails, Prompt Injection, SHAP Additivity, and Counterfactual Validity):
```bash
cd credit-risk-xai
ml-service\venv\Scripts\python tests\test_suite.py
```
**Expected Output:**
```
[PASS] Test 1: Valid applicant scored PD
[PASS] Test 2: Out-of-bounds input flagged (Guardrails active)
[PASS] Test 3: Prompt injection caught: Triggered adversarial safety rule
[PASS] Test 4: TreeSHAP Additivity verified (Difference = 0.00000000)
[PASS] Test 5: Counterfactual recourse plans verified (Immutable features locked)
[PASS] Test 6: Grounding verifier evaluated: 100.0% grounded
Ran 6 tests in ~0.65s (OK)
```

---

## 🎓 Viva Demo Script: 10 Steps for Project Examiners

When presenting to professors, project guides, or industry examiners, follow this 10-step demonstration flow:

1. **Landing Page Architecture (1 min)**:
   - Navigate to `http://localhost:5173`.
   - Point out the 4-layer pipeline: *Input Guardrails → Calibrated ML (AUC 0.805) → TreeSHAP & Recourse → Grounded Agentic Reasoning*.
2. **RBAC & Governance Login (30 sec)**:
   - Click "Launch Demo" or "Sign In".
   - Use the **Admin Quick-Fill** button (`admin@demo.com`) to demonstrate secure JWT authentication with bcrypt hashing.
3. **Executive Dashboard KPIs (1 min)**:
   - Walk through the real-time KPIs: Total Loans, Approval Rate, Mean PD, and Manual Reviews count.
   - Show the interactive **Risk Band Doughnut Chart** (Low, Moderate, High) and the **Global TreeSHAP Feature Gain** bar chart.
4. **Triggering Low-Risk Prime Application (1.5 min)**:
   - Go to "New Risk Assessment".
   - Click the **"Low Risk" Viva Preset** button (Catherine Vance, FICO 785, DTI 12%).
   - Click "Execute Risk Assessment & SHAP Explanation".
   - Observe the green Low-Risk badge, Probability of Default (PD < 5%), and policy compliance.
5. **Examining TreeSHAP Mathematical Additivity (1.5 min)**:
   - Highlight the **TreeSHAP Additivity Card**: explain to examiners that $|f(x) - (\phi_0 + \sum \phi_i)| < 1e-4$ holds strictly in log-odds space, proving zero mathematical leakage.
   - Point out the **SHAP Waterfall / Contribution Bar**: green bars represent mitigating credit anchors (high income, clean credit history), while red bars represent risk drivers.
6. **Anti-Hallucination Underwriting Memo (1 min)**:
   - Show the **Four-Section Agentic Memo**: (1) Executive Risk Summary, (2) Key Drivers with exact SHAP numbers, (3) Mitigating Factors, (4) Policy Alignment.
   - Highlight the **100% Grounding Rate Badge**: explain that every single numeric value in the memo is cross-checked against the payload to prevent generative hallucinations.
7. **Adverse Action & What-If Counterfactual Simulator (2 min)**:
   - Navigate back to "New Assessment" and click the **"High Risk" Viva Preset** (Derek Thornton, FICO 550, DTI 51%).
   - Execute the assessment. The applicant lands in the **High Risk** tier with failed policy clauses (`POL-DTI-01`, `POL-CS-02`).
   - Scroll to the **Actionable What-If Simulator**: drag the DTI slider down to 25% and reduce the loan amount. Click "Simulate Restructured Terms" to show examiners how an unapproved borrower can achieve approval via mutable financial adjustments.
8. **Institutional Compliance PDF Generation (1 min)**:
   - Click "Download Bank-Grade PDF Report".
   - Open the generated PDF: highlight the official bank header, executive metadata, SHAP contributions, and FCRA/ECOA adverse action compliance notices.
9. **Batch Portfolio CSV Scoring (1 min)**:
   - Go to "Portfolio Batch".
   - Upload the provided `sample_batch_applicants.csv` (located in `client/public/`).
   - Observe instant batch inference across applicants with live tier distribution and filtering tabs.
10. **Model Benchmarks & Immutable Audit Trail (1 min)**:
    - Visit "Model Governance & XAI" to show the ROC curve and compare **LightGBM Champion vs XGBoost vs Logistic Regression**.
    - Show the **TreeSHAP vs LIME latency chart**: explain why TreeSHAP $O(TLD^2)$ is orders of magnitude faster than perturbation-based LIME.
    - Visit "Audit Trail" to show the immutable log of every decision, model version, and authorized officer action.

---

## 📂 Project Structure Details

```
credit-risk-xai/
├── data/
│   ├── generate_data.py               # Generates 10,000 LendingClub dataset & German Credit subset
│   ├── lending_club_synthetic_10k.csv  # 10k sample training dataset
│   └── german_credit_benchmark.csv    # Benchmark dataset
├── ml-service/
│   ├── app.py                         # FastAPI REST microservice
│   ├── train.py                       # Stratified split, training, calibration, model artifact bundle
│   ├── preprocessing.py               # Feature definitions, imputation & one-hot encoding
│   ├── shap_engine.py                 # TreeSHAP explainer with strict additivity verification
│   ├── counterfactual.py              # Constrained recourse on mutable features
│   ├── policy.py                      # Deterministic underwriting policy covenants (POL-2026.1)
│   ├── guardrails.py                  # PII masking, bounds validation & prompt injection shield
│   ├── agent.py                       # 4-section underwriting memo with numeric grounding verifier
│   └── requirements.txt               # Pinned Python ML dependencies
├── server/
│   ├── src/
│   │   ├── index.js                   # Express server entry point with MongoDB fallback
│   │   ├── routes/auth.js             # JWT authentication and user management
│   │   ├── routes/api.js              # Assessment, cases, batch, portfolio & PDF routes
│   │   ├── middleware/auth.js         # Bearer token verification & RBAC authorization
│   │   ├── models/fileStore.js        # Resilient auto-persisted JSON database engine
│   │   └── pdf/reportBuilder.js       # Bank-grade compliance PDF report builder (PDFKit)
│   └── package.json
├── client/
│   ├── src/
│   │   ├── pages/                     # Landing, Login, Dashboard, Assessment, Result, Batch, etc.
│   │   ├── components/Layout.jsx      # Navigation sidebar and header layout
│   │   ├── context/AuthContext.jsx    # Authentication & session state
│   │   └── services/api.js            # Axios interceptors with Bearer token injection
│   └── package.json
├── tests/
│   └── test_suite.py                  # Automated 6-point test suite
├── start-all.bat                      # Windows one-click startup
├── start-all.sh                       # Linux/macOS one-click startup
├── .env.example
└── README.md
```
