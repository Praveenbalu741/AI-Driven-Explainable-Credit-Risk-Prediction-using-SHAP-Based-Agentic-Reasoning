@echo off
TITLE CredXAI: AI-Driven Explainable Credit Risk Prediction
echo =====================================================================
echo  CredXAI: AI-Driven Explainable Credit Risk Prediction
echo  Starting ML Microservice, Governance API, and Frontend...
echo =====================================================================

cd /d %~dp0

:: Check if virtualenv exists, if not, create
if not exist "ml-service\venv\Scripts\python.exe" (
    echo [1/3] Creating Python virtual environment...
    python -m venv ml-service\venv
    call ml-service\venv\Scripts\pip.exe install -r ml-service\requirements.txt
)

:: Train model if bundle does not exist
if not exist "ml-service\model_artifacts\credit_risk_bundle.joblib" (
    echo [*] Training champion LightGBM model and creating TreeSHAP background...
    ml-service\venv\Scripts\python.exe ml-service\train.py
)

:: Start ML Microservice (FastAPI on Port 8000)
echo [1/3] Launching ML Microservice (FastAPI on http://localhost:8000)...
start "CredXAI - ML Service" cmd /k "cd ml-service && venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload"

:: Start Governance API Server (Express on Port 5000)
echo [2/3] Launching Governance API Server (Express on http://localhost:5000)...
start "CredXAI - Governance Server" cmd /k "cd server && npm start"

:: Start React Frontend (Vite on Port 5173)
echo [3/3] Launching React Client (Vite on http://localhost:5173)...
start "CredXAI - Client" cmd /k "cd client && npm run dev"

echo.
echo =====================================================================
echo  All services launched successfully!
echo  Client URL:      http://localhost:5173
echo  Governance API:  http://localhost:5000/api
echo  ML Microservice: http://localhost:8000/docs
echo.
echo  Demo Credentials:
echo    - Admin:    admin@demo.com   / Demo@123
echo    - Manager:  manager@demo.com / Demo@123
echo    - Analyst:  analyst@demo.com / Demo@123
echo =====================================================================
pause
