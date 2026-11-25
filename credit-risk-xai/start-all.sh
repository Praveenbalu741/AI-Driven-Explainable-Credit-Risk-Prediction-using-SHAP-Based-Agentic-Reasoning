#!/usr/bin/env bash
echo "====================================================================="
echo " CredXAI: AI-Driven Explainable Credit Risk Prediction"
echo " Starting ML Microservice, Governance API, and Frontend..."
echo "====================================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Python Virtual Environment
if [ ! -d "ml-service/venv" ]; then
    echo "[1/3] Setting up Python virtual environment..."
    python3 -m venv ml-service/venv
    ml-service/venv/bin/pip install -r ml-service/requirements.txt
fi

# Model training check
if [ ! -f "ml-service/model_artifacts/credit_risk_bundle.joblib" ]; then
    echo "[*] Training initial LightGBM champion model bundle..."
    ml-service/venv/bin/python ml-service/train.py
fi

# 2. Launch FastAPI
echo "[1/3] Launching ML Microservice (FastAPI on http://localhost:8000)..."
(cd ml-service && venv/bin/python -m uvicorn app:app --host 0.0.0.0 --port 8000) &
ML_PID=$!

# 3. Launch Governance Express Server
echo "[2/3] Launching Governance API Server (Express on http://localhost:5000)..."
(cd server && npm start) &
SERVER_PID=$!

# 4. Launch React Client
echo "[3/3] Launching React Client (Vite on http://localhost:5173)..."
(cd client && npm run dev) &
CLIENT_PID=$!

echo ""
echo "====================================================================="
echo " All services running in background!"
echo " Client:       http://localhost:5173"
echo " Express API:  http://localhost:5000/api"
echo " ML FastAPI:   http://localhost:8000/docs"
echo ""
echo " Press Ctrl+C to terminate all services."
echo "====================================================================="

trap "kill $ML_PID $SERVER_PID $CLIENT_PID; exit 0" SIGINT SIGTERM
wait
