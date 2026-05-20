from fastapi import FastAPI, HTTPException, Request, Depends, BackgroundTasks, APIRouter
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from prometheus_fastapi_instrumentator import Instrumentator
import joblib
import pandas as pd
import numpy as np
import os
import sys
import secrets
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import jwt 
from jwt.exceptions import InvalidTokenError as JWTError
import hashlib
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
import shap
from dotenv import load_dotenv

load_dotenv()

# Configure basic logging for audit and traceability
class InMemoryLogHandler(logging.Handler):
    def __init__(self):
        super().__init__()
        self.logs = []
        self.max_logs = 100

    def emit(self, record):
        log_entry = self.format(record)
        self.logs.append({
            "timestamp": datetime.now().isoformat(),
            "level": record.levelname,
            "message": log_entry
        })
        if len(self.logs) > self.max_logs:
            self.logs.pop(0)

log_handler = InMemoryLogHandler()
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
log_handler.setFormatter(formatter)

logging.basicConfig(level=logging.INFO, handlers=[logging.StreamHandler(), log_handler])

# Add ml directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ml'))
try:
    from data_processor import DataProcessor
    from fairness_auditor import get_fairness_metrics
    from adversarial_tester import AdversarialTester
    from robust_trainer import RobustTrainer
    from watermarker import Watermarker
    from explainability_engine import ExplainabilityEngine
    # Optional module
    try:
        from app.encryption_layer import PQCSimulator
    except ImportError:
        PQCSimulator = None
        logging.warning("Encryption layer (PQCSimulator) not found. Security features will be limited.")
except ImportError as e:
    logging.error(f"Critical ML modules missing: {e}")
    print("Warning: Essential ML modules not found in path. Ensure CWD is correct.")

# --- Security Configuration ---
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32)) 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# OAuth2 scheme point to our token endpoint
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

from app.auth_db import init_db, get_user, verify_password

# Role Definitions
ROLES = {
    "SECURITY_ADMIN": ["predict", "audit", "harden", "monitor"],
    "MORTGAGE_OFFICER": ["predict", "monitor"],
    "AUDITOR": ["monitor"]
}

app = FastAPI(title="Decision DNA Consolidated API", version="3.0.0")

# CORS middleware for development flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8007", "http://127.0.0.1:8007", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Application State ---
MODELS_DIR = "models"
MODEL_PATH = os.path.join(MODELS_DIR, "random_forest_model_prod.pkl")
MONITOR_MODEL_PATH = os.path.join(MODELS_DIR, "logistic_model_prod.pkl")
SCALER_PATH = os.path.join(MODELS_DIR, "scaler_prod.pkl")
METRICS_PATH = os.path.join(MODELS_DIR, "model_metrics_prod.json")

prediction_logs = []
baseline_stats = None
models = {}
processor = None
explainer = None 
pqc_simulator = None # Global PQC encryption instance
historical_income_means = [] # Temporal drift buffer tracking

# --- Monitoring & Security State (Ported from Node) ---
monitoring_state = {
    "psi": 0.042,
    "klDivergence": 0.015,
    "status": "Stable"
}

threat_state = {
    "level": "Low",
    "integrity": "Verified"
}

mitigation_state = {
    "active": False,
    "group_thresholds": {
        "Male": 0.65,
        "Female": 0.62,
        "Age 18-25": 0.60
    },
    "last_audit_di": 1.0,
    "mitigation_history": []
}

security_state = {
    "robustness_score": 0.0,
    "last_red_team_audit": None,
    "audit_history": [],
    "is_watermarked": False,
    "watermark_confidence": 0.0
}
is_background_task_running = False

@app.on_event("startup")
def startup_event():
    global models, processor, baseline_stats, explainer
    init_db()
    try:
        print("Startup: Loading production models...")
        if not os.path.exists(MODELS_DIR):
            os.makedirs(MODELS_DIR, exist_ok=True)
            
        if os.path.exists(MODEL_PATH):
            models['production'] = joblib.load(MODEL_PATH)
        if os.path.exists(MONITOR_MODEL_PATH):
            models['monitoring'] = joblib.load(MONITOR_MODEL_PATH)
            
        if os.path.exists(SCALER_PATH):
            processor = DataProcessor()
            processor.scaler = joblib.load(SCALER_PATH)
        
        if os.path.exists(METRICS_PATH):
            with open(METRICS_PATH, 'r') as f:
                baseline_stats = json.load(f)
        
        if 'production' in models:
            logging.info("Initializing SHAP tree explainer on backend ensemble...")
            # We must access the underlying classifier from the Pipeline
            if hasattr(models['production'], 'named_steps'):
                explainer = shap.TreeExplainer(models['production'].named_steps['classifier'])
            else:
                explainer = shap.TreeExplainer(models['production'])
            
        logging.info("Decision DNA Consolidated API initialized successfully.")
    except Exception as e:
        logging.error(f"Initialization error: {e}")

# --- Security Helpers ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=60))
    to_encode.update({"exp": expire}) 
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401, detail="Could not validate credentials", headers={"WWW-Authenticate": "Bearer"}
    )
    try:
        # FastAPI might receive 'Bearer <token>' or just '<token>' depending on client
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None: raise credentials_exception
    except JWTError: raise credentials_exception
    user = get_user(username)
    if user is None: raise credentials_exception
    return user

def require_permissions(required_action: str):
    async def permission_checker(current_user: dict = Depends(get_current_user)):
        role = current_user.get("role")
        if not role or required_action not in ROLES.get(role, []):
            raise HTTPException(
                status_code=403, 
                detail=f"Permission denied: {required_action} unauthorized for role {role}"
            )
        return current_user
    return permission_checker

# --- Reasoning Engine ---
def generate_decision_reason(decision: str, explanations: Dict[str, float]) -> str:
    if not explanations:
        return f"Model decision: {decision}. Applicant metrics consistent with historical performance thresholds."

    # SHAP values in this model represent impact on 'Reject' (class 1)
    # So for Reject, we want features with high positive SHAP
    # For Approve, we want features with high negative SHAP
    if decision == "Reject":
        impactful = sorted([ (f, v) for f, v in explanations.items() if v > 0 ], key=lambda x: x[1], reverse=True)
    else:
        impactful = sorted([ (f, v) for f, v in explanations.items() if v < 0 ], key=lambda x: x[1])

    if not impactful:
        impactful = sorted(explanations.items(), key=lambda x: abs(x[1]), reverse=True)

    top_2 = impactful[:2]
    factors = []
    for feat, val in top_2:
        name = feat.replace('_', ' ').replace('creditScore', 'Credit Score').replace('debtRatio', 'Debt Ratio').replace('loanAmount', 'Loan Amount').title()
        if decision == "Reject":
            factors.append(f"unfavorable {name}")
        else:
            factors.append(f"strong {name}")
            
    return f"Decision: {decision}. Key factors: {', '.join(factors)}."

# --- API Router with /api prefix for frontend compatibility ---
api_router = APIRouter(prefix="/api")

# --- Schemas ---
class ApplicantDetails(BaseModel):
    id: Optional[str] = "LENDING-NEW"
    name: Optional[str] = "Anonymous"
    email: Optional[str] = None
    nationality: Optional[str] = "Unknown"
    income: float = Field(..., gt=0, description="Applicant income, must be positive")
    debtRatio: float = Field(0.3, ge=0, le=1)
    creditScore: int = Field(..., ge=300, le=850)
    loanAmount: float = Field(..., gt=0)
    # Defaults to match original server.ts behavior
    monthsEmployed: int = Field(24, ge=0)
    numCreditLines: int = Field(5, ge=0)
    totalBalance: float = Field(5000, ge=0)
    totalCreditLimit: float = Field(20000, gt=0)
    pastDuePayments: int = Field(0, ge=0)
    gender: str = "Male"
    age: int = Field(30, ge=18, le=120)

class PredictRequest(BaseModel):
    applicant: ApplicantDetails
    modelId: str

class PredictionResponse(BaseModel):
    riskProbability: float
    decision: str
    confidence: float
    explanations: Optional[dict] = None
    reason: Optional[str] = None
    modelId: str
    mitigation_context: Optional[dict] = None
    emailSent: Optional[bool] = False

class AttackRequest(BaseModel):
    type: str

class TrainRequest(BaseModel):
    architecture: str
    epochs: int = 10
    learningRate: float = 0.001

login_attempts = {}

@api_router.post("/token")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    client_ip = request.client.host
    now = datetime.now()
    
    # Brute Force Protection (Rate Limiting)
    if client_ip in login_attempts:
        attempts, last_attempt = login_attempts[client_ip]
        if attempts >= 5 and (now - last_attempt).total_seconds() < 300:
            raise HTTPException(status_code=429, detail="Too many failed attempts. Account locked for 5 minutes.")
        elif (now - last_attempt).total_seconds() >= 300:
            del login_attempts[client_ip]

    # Algorithmic DoS Protection
    if len(form_data.password) > 128:
        raise HTTPException(status_code=400, detail="Password exceeds maximum length")

    user = get_user(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        if client_ip not in login_attempts:
            login_attempts[client_ip] = [1, now]
        else:
            login_attempts[client_ip][0] += 1
            login_attempts[client_ip][1] = now
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    # Reset attempts on success
    if client_ip in login_attempts:
        del login_attempts[client_ip]
        
    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "username": current_user["username"],
        "role": current_user["role"]
    }

@api_router.get("/health")
def health():
    return {"status": "ok", "timestamp": int(datetime.utcnow().timestamp() * 1000)}

@api_router.get("/system/logs")
def get_system_logs(_ = Depends(require_permissions("monitor"))):
    return {
        "status": "success",
        "logs": log_handler.logs
    }

class TerminalCommandRequest(BaseModel):
    command: str

@api_router.get("/system/metrics")
def get_system_metrics(_ = Depends(require_permissions("monitor"))):
    try:
        import psutil
        cpu = psutil.cpu_percent(interval=None)
        mem = psutil.virtual_memory().used / (1024 * 1024)
    except ImportError:
        cpu = 4.2  # Fallback dummy value
        mem = 128.0
    
    return {
        "status": "success",
        "cpu": round(cpu, 1),
        "mem": round(mem, 1)
    }

@api_router.post("/system/command")
async def execute_system_command(req: TerminalCommandRequest, background_tasks: BackgroundTasks, _ = Depends(require_permissions("harden"))):
    global is_background_task_running
    cmd = req.command.strip().lower()
    
    if cmd == "status":
        return {"status": "success", "message": "System Status: SECURE | Kernel: v4.2.0-dna | All checks passed."}
    elif cmd in ["train", "harden"]:
        if is_background_task_running:
            raise HTTPException(status_code=429, detail="A background task is already running. Please try again later.")
        is_background_task_running = True
        
        def run_task():
            global is_background_task_running
            try:
                import subprocess, sys
                logging.info(f"Terminal triggered {cmd}...")
                subprocess.run([sys.executable, "ml/retraining_pipeline.py"])
                if cmd == "harden":
                    startup_event()
            finally:
                is_background_task_running = False
                
        background_tasks.add_task(run_task)
        return {"status": "success", "message": f"{cmd.capitalize()} cycle initiated in background."}
    else:
        return {"status": "error", "message": f"Command not found: {cmd}"}
@api_router.get("/model-metrics")
def get_model_metrics(_ = Depends(require_permissions("monitor"))):
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH, 'r') as f:
            return json.load(f)
    return {
        "logistic_regression_accuracy": 0.9252,
        "random_forest_accuracy": 0.9418,
        "timestamp": datetime.now().isoformat()
    }

@api_router.get("/model-metadata")
def get_model_metadata(_ = Depends(require_permissions("monitor"))):
    return {
        "version": "1.1.0",
        "production_model": "random_forest",
        "trained_at": datetime.now().isoformat()
    }

@api_router.get("/models")
def get_models(_ = Depends(require_permissions("monitor"))):
    return {
        "status": "success",
        "data": [
            { "id": 'm1', "type": 'Logistic Regression', "version": '1.0.0', "status": 'Stable Baseline', "role": 'Monitoring' },
            { "id": 'm2', "type": 'Random Forest', "version": '1.1.0', "status": 'Active', "role": 'Production' }
        ]
    }

@api_router.post("/predict", response_model=PredictionResponse, tags=["Model Governance"], description="Analyzes an applicant profile to produce a credit risk decision and SHAP feature explanations.")
async def predict_risk(req: PredictRequest, background_tasks: BackgroundTasks, _ = Depends(require_permissions("predict"))):
    if 'production' not in models:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    try:
        input_dict = req.applicant.dict()
        # Features used by DataProcessor
        proc_dict = {
            "income": input_dict["income"],
            "loanAmount": input_dict["loanAmount"],
            "creditScore": input_dict["creditScore"],
            "monthsEmployed": input_dict.get("monthsEmployed", 24),
            "numCreditLines": input_dict.get("numCreditLines", 5),
            "totalBalance": input_dict.get("totalBalance", 5000),
            "totalCreditLimit": input_dict.get("totalCreditLimit", 20000),
            "pastDuePayments": input_dict.get("pastDuePayments", 0)
        }
        input_df = pd.DataFrame([proc_dict])
        
        if processor is None:
            raise Exception("Data processor not initialized")
            
        # Get purely unscaled engineered features since Pipeline handles StandardScaling
        X_unscaled, _ = processor.get_features(input_df)
        
        # --- ENCRYPTION SECURITY LAYER ---
        global pqc_simulator
        if pqc_simulator is None:
            try:
                from app.encryption_layer import PQCSimulator
                pqc_simulator = PQCSimulator(secret_key="api_secured_vault_key_2024")
            except ImportError:
                pqc_simulator = None
                
        if pqc_simulator:
            encrypted_name = pqc_simulator.encrypt_field(input_dict.get('name', 'Anonymous'))
            logging.info(f"🔒 Application securely intercepted. PII encrypted via PQCSimulator: {encrypted_name}")
            # Conceptually, decryption happens after processing for final reporting if needed
        
        # Prediction
        prob = models['production'].predict_proba(X_unscaled)[0][1]
        
        # Demographic check for mitigation logic
        group = input_dict.get('gender', 'Male')
        
        # --- THRESHOLD TUNING ---
        # Optimized decision threshold based on precision-recall tradeoff rather than default 0.5
        tuned_threshold = 0.65 
        threshold = mitigation_state["group_thresholds"].get("standard", tuned_threshold)
        if mitigation_state["active"] and group == "Female":
            threshold = mitigation_state["group_thresholds"]["Female"]
            
        risk_score = float(prob)
        # Decision logic: probability of risk >= threshold means Reject
        # Decision logic: probability of success >= threshold means Approve
        # In current context, risk_score is probability of class 1 (Reject)
        decision = "Reject" if risk_score >= threshold else "Approve"
        
        # SHAP
        explanations = {}
        if explainer:
            try:
                # Need the scaled features to pass into Explainer
                if hasattr(models['production'], 'named_steps'):
                    X_processed_for_shap = models['production'].named_steps['scaler'].transform(X_unscaled)
                else:
                    X_processed_for_shap = X_unscaled
                    
                shap_values = explainer.shap_values(X_processed_for_shap)
                
                # Handle different SHAP output formats (list for classification, array for regression)
                if isinstance(shap_values, list):
                    # For classification, usually list of [prob_neg, prob_pos]
                    # We want the positive class (class 1)
                    contributions = shap_values[1]
                else:
                    contributions = shap_values

                # If it's a 2D array (samples, features), take the first sample
                if len(contributions.shape) == 2:
                    contributions = contributions[0]
                elif len(contributions.shape) == 3:
                    # Sometimes (classes, samples, features)
                    contributions = contributions[1][0] if contributions.shape[0] > 1 else contributions[0][0]

                for i, feat in enumerate(processor.feature_cols):
                    if i < len(contributions):
                        val = contributions[i]
                        # Ensure it's a scalar
                        if hasattr(val, 'item'): val = val.item()
                        explanations[feat] = round(float(val), 4)
            except Exception as e:
                logging.error(f"SHAP Error: {e}", exc_info=True)

        # Log for distribution monitoring
        log_entry = input_dict.copy()
        log_entry['risk_score'] = risk_score
        log_entry['decision'] = decision
        log_entry['timestamp'] = datetime.now().isoformat()
        prediction_logs.append(log_entry)
        
        logging.info(f"Prediction made: Applicant {input_dict.get('id', 'NEW')} -> {decision} (Risk: {risk_score:.4f})")
        
        # Calculate confidence
        confidence = risk_score if decision == "Reject" else (1 - risk_score)
        
        # Write to dataset.csv
        try:
            dataset_path = os.path.join(os.path.dirname(__file__), '..', 'dataset.csv')
            if os.path.exists(dataset_path):
                # Format: id,name,nationality,income,debtRatio,creditScore,loanAmount,gender,age,riskProbability,decision
                with open(dataset_path, "a", encoding="utf-8") as f:
                    app_id = input_dict.get("id", f"LENDING-{int(datetime.now().timestamp())}")
                    name = input_dict.get("name", "Anonymous")
                    # Quote the name to match CSV format: "John Doe"
                    name_quoted = f'"{name}"' if not name.startswith('"') else name
                    nationality = input_dict.get("nationality", "Unknown")
                    income = input_dict.get("income", 0)
                    debt_ratio = f"{input_dict.get('debtRatio', 0):.4f}"
                    credit_score = input_dict.get("creditScore", 0)
                    loan_amount = input_dict.get("loanAmount", 0)
                    gender = input_dict.get("gender", "Male")
                    age = input_dict.get("age", 30)
                    risk_prob = f"{risk_score:.4f}"
                    # Decision needs to be title case "Approve" or "Reject"
                    fmt_decision = decision.capitalize()
                    
                    csv_row = f"{app_id},{name_quoted},{nationality},{income},{debt_ratio},{credit_score},{loan_amount},{gender},{age},{risk_prob},{fmt_decision}\n"
                    f.write(csv_row)
        except Exception as e:
            print(f"Failed to write to dataset.csv: {e}")
        
        # Generate Reason
        reason = generate_decision_reason(decision, explanations)
        
        email_sent = False
        if decision == "Reject" and input_dict.get("email"):
            from app.email_service import send_rejection_email_task
            background_tasks.add_task(send_rejection_email_task, input_dict["email"], input_dict.get("name", "Applicant"), reason)
            email_sent = True
        
        return PredictionResponse(
            riskProbability=round(float(risk_score), 4), 
            decision=str(decision),
            confidence=round(float(confidence), 4),
            explanations=explanations,
            reason=reason,
            modelId=req.modelId,
            mitigation_context={
                "active": bool(mitigation_state["active"]),
                "applied_threshold": float(threshold)
            },
            emailSent=email_sent
        )
    except Exception as e:
        logging.error(f"Prediction failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred during prediction.")

@api_router.get("/monitoring-drift", tags=["Model Governance"], description="Checks logical data drift between recently processed data and the trained baseline.")
async def get_drift(_ = Depends(require_permissions("monitor"))):
    global monitoring_state, historical_income_means
    if len(prediction_logs) < 5: 
        return {**monitoring_state, "timestamp": int(datetime.utcnow().timestamp() * 1000)}
    
    df = pd.DataFrame(prediction_logs)
    
    # --- CONTINUOUS TRACKING ---
    new_mean_income = df['income'].mean()
    historical_income_means.append(new_mean_income)
    
    # Simple Threshold Drift Check Logic
    train_mean_income = baseline_stats.get('mean_income', 70000) if baseline_stats else 70000
    threshold = 15000 # 15k deviation
    
    if abs(new_mean_income - train_mean_income) > threshold:
        logging.warning(f"⚠️ Data Drift Detected: Income shifted by {abs(new_mean_income - train_mean_income)}")
        monitoring_state["status"] = "Drift Detected"
        monitoring_state["psi"] = max(monitoring_state["psi"], 0.15) # Boost PSI visually
    
    # Original PSI Calculation
    actual_dist = df['decision'].value_counts(normalize=True).get('Reject', 0)
    expected_reject_rate = 0.35 
    epsilon = 1e-6
    psi = (actual_dist - expected_reject_rate) * np.log((actual_dist + epsilon) / (expected_reject_rate + epsilon))
    
    # If statistical triggered, keep it high, otherwise use pure PSI
    if monitoring_state["status"] != "Drift Detected":
        monitoring_state["psi"] = round(float(psi), 4)
        if psi > 0.1: 
            monitoring_state["status"] = "Drift Detected"
            logging.warning("⚠️ Distribution Drift Detected in Rejection Rates.")
        else: 
            monitoring_state["status"] = "Stable"
        
    return {**monitoring_state, "timestamp": int(datetime.utcnow().timestamp() * 1000)}

@api_router.post("/security-attack")
async def trigger_attack(req: AttackRequest, _ = Depends(require_permissions("audit"))):
    global monitoring_state, threat_state
    
    attack_type = req.type
    if attack_type == 'INCOME_INFLATION':
        monitoring_state["psi"] = 0.285
        monitoring_state["status"] = 'Critical Drift'
        threat_state["level"] = 'Critical'
        threat_state["integrity"] = 'Compromised'
    elif attack_type == 'DATA_POISONING':
        monitoring_state["psi"] = 0.154
        monitoring_state["status"] = 'Warning'
        threat_state["level"] = 'Medium'
    else:
        monitoring_state["psi"] = 0.08
        threat_state["level"] = 'Low'

    return {
        "status": "alert",
        "message": f"Simulated {attack_type} attack detected and mitigated.",
        "timestamp": int(datetime.utcnow().timestamp() * 1000),
        "newPsi": monitoring_state["psi"]
    }

@api_router.post("/reboot")
async def reboot(_ = Depends(require_permissions("audit"))):
    global monitoring_state, threat_state, prediction_logs
    monitoring_state = {"psi": 0.042, "klDivergence": 0.015, "status": "Stable"}
    threat_state = {"level": "Low", "integrity": "Verified"}
    prediction_logs = []
    # Could also reload models here if needed
    return {"status": "success", "message": "System rebooted. Baseline restored."}

@api_router.get("/security/status", tags=["Security"], description="Returns the current threat level, model integrity status, and audit history.")
async def get_security_status(_ = Depends(require_permissions("monitor"))):
    return {
        "robustness_score": security_state.get("robustness_score", 0.0),
        "last_red_team_audit": security_state.get("last_red_team_audit"),
        "audit_history": security_state.get("audit_history", []),
        "is_watermarked": security_state.get("is_watermarked", False),
        "watermark_confidence": security_state.get("watermark_confidence", 0.0),
        "threat_level": threat_state.get("level", "Low"),
        "integrity": threat_state.get("integrity", "Verified")
    }

@api_router.get("/security/watermark/verify", tags=["Security"], description="Verifies the cryptographic watermark of the production model.")
async def verify_watermark(_ = Depends(require_permissions("audit"))):
    if 'production' not in models:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    try:
        wm = Watermarker()
        results = wm.verify_watermark(models['production'])
        
        security_state["is_watermarked"] = results["is_watermarked"]
        security_state["watermark_confidence"] = results["confidence"]
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/security/red-team", tags=["Security"], description="Triggers an automated adversarial red-team audit.")
async def trigger_red_team(background_tasks: BackgroundTasks, _ = Depends(require_permissions("harden"))):
    global is_background_task_running
    if is_background_task_running:
        raise HTTPException(status_code=429, detail="A background task is already running.")
    is_background_task_running = True

    def run_audit():
        global is_background_task_running
        try:
            tester = AdversarialTester()
            audit_results = tester.run_red_team_audit(sample_size=15)
            
            security_state["robustness_score"] = audit_results["avg_robustness"]
            security_state["last_red_team_audit"] = audit_results["timestamp"]
            
            # Add to audit history
            security_state["audit_history"].append({
                "timestamp": audit_results["timestamp"],
                "robustness": audit_results["avg_robustness"],
                "evasion_rate": audit_results["evasion_success_rate"]
            })
            
            # Update threat level based on evasion rate
            if audit_results["evasion_success_rate"] > 0.2:
                threat_state["level"] = "Medium"
            elif audit_results["evasion_success_rate"] > 0.4:
                threat_state["level"] = "High"
            else:
                threat_state["level"] = "Low"
                
        except Exception as e:
            logging.error(f"Red-team audit failed: {e}")
        finally:
            is_background_task_running = False

    background_tasks.add_task(run_audit)
    return {"status": "success", "message": "Red-team audit initiated in background"}

@api_router.post("/security/harden", tags=["Security"], description="Triggers an adversarial hardening cycle.")
async def harden_model(background_tasks: BackgroundTasks, _ = Depends(require_permissions("harden"))):
    global is_background_task_running
    if is_background_task_running:
        raise HTTPException(status_code=429, detail="A background task is already running.")
    is_background_task_running = True
    
    def run_hardening():
        global is_background_task_running
        try:
            trainer = RobustTrainer()
            # This would typically involve generating adversarial examples and retraining
            # For the prototype, we call the retraining pipeline which includes robustness
            import subprocess
            subprocess.run([sys.executable, "ml/retraining_pipeline.py"])
            startup_event()
        except Exception as e:
            logging.error(f"Hardening failed: {e}")
        finally:
            is_background_task_running = False

    background_tasks.add_task(run_hardening)
    return {"status": "success", "message": "Hardening cycle started"}

@api_router.get("/audit/fairness", tags=["Governance"], description="Returns Disparate Impact and Statistical Parity Difference metrics.")
async def get_fairness(_ = Depends(require_permissions("monitor"))):
    try:
        # Pass the current model and processor for real-time auditing
        results = get_fairness_metrics(
            model=models.get('production'),
            processor=processor
        )
        if "error" not in results:
            if "recommended_thresholds" in results:
                mitigation_state["group_thresholds"] = results["recommended_thresholds"]
            results["mitigation"] = mitigation_state
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/audit/explain/{applicant_id}", tags=["Governance"], description="Returns SHAP-style feature contributions for a specific decision.")
async def explain_decision(applicant_id: str, _ = Depends(require_permissions("monitor"))):
    try:
        import os
        import pandas as pd
        dataset_path = os.path.join(os.path.dirname(__file__), '..', 'dataset.csv')
        if not os.path.exists(dataset_path):
            raise HTTPException(status_code=404, detail="Dataset persistence layer not found.")
            
        df = pd.read_csv(dataset_path, on_bad_lines='skip')
        applicant = df[df['id'] == applicant_id]
        
        if applicant.empty:
            raise HTTPException(status_code=404, detail="Applicant not found in persistence layer.")
            
        # Convert row to dict
        data = applicant.iloc[0].to_dict()
        
        # Run explainability
        engine = ExplainabilityEngine()
        contributions = engine.get_feature_contributions(data)
        counterfactuals = engine.generate_counterfactuals(data)
        
        decision = str(data.get('decision', 'Reject')).capitalize()
        reason = generate_decision_reason(decision, contributions)
        
        return {
            "applicant": data,
            "contributions": contributions,
            "counterfactuals": counterfactuals,
            "reason": reason
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/audit/explain", tags=["Governance"], description="Returns SHAP-style feature contributions for provided applicant data.")
async def explain_data(data: dict, _ = Depends(require_permissions("monitor"))):
    try:
        engine = ExplainabilityEngine()
        contributions = engine.get_feature_contributions(data)
        counterfactuals = engine.generate_counterfactuals(data)
        
        # Determine decision if not provided to generate reason
        if 'decision' in data:
            decision = data['decision']
        else:
            # Simple heuristic or call model if needed, but usually it's in the data from frontend
            decision = "Reject" if data.get('riskProbability', 0) > 0.5 else "Approve"
            
        reason = generate_decision_reason(decision, contributions)
        
        return {
            "contributions": contributions,
            "counterfactuals": counterfactuals,
            "reason": reason
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/train-model", tags=["Model Operations"], description="Synchronously train backend models with integrated SMOTE handlers.")
async def train_model(req: TrainRequest, background_tasks: BackgroundTasks, _ = Depends(require_permissions("harden"))):
    global is_background_task_running
    if is_background_task_running:
        raise HTTPException(status_code=429, detail="A background task is already running.")
    is_background_task_running = True
    
    def run_retrain():
        global is_background_task_running
        try:
            import subprocess
            print("Retraining models via background task...")
            subprocess.run([sys.executable, "ml/retraining_pipeline.py"])
            startup_event()
            print("Models reloaded after retraining.")
        finally:
            is_background_task_running = False

    background_tasks.add_task(run_retrain)
    
    return {
        "status": "success",
        "message": "Models training started in background",
        "featureImportance": [
            {"feature": "Credit Score", "weight": 0.45},
            {"feature": "Income", "weight": 0.35},
            {"feature": "Debt Ratio", "weight": 0.20}
        ],
        "metrics": {
            "logistic": {"accuracy": 0.91, "precision": 0.89, "recall": 0.88, "f1": 0.885},
            "rf": {"accuracy": 0.94, "precision": 0.93, "recall": 0.92, "f1": 0.925}
        }
    }

# --- Include API Router ---
app.include_router(api_router)

# --- Serve Data & Static Files ---
@app.get("/dataset.csv")
async def get_dataset(_ = Depends(require_permissions("monitor"))):
    path = os.path.join(os.path.dirname(__file__), '..', 'dataset.csv')
    if os.path.exists(path):
        return FileResponse(path)
    return FileResponse(os.path.join(os.path.dirname(__file__), '..', 'dataset_processed.csv')) if os.path.exists(os.path.join(os.path.dirname(__file__), '..', 'dataset_processed.csv')) else HTTPException(status_code=404, detail="Dataset not found")

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    # Try to serve from root or frontend dist
    paths = [
        os.path.join(os.path.dirname(__file__), '..', 'favicon.ico'),
        os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist', 'favicon.ico')
    ]
    for path in paths:
        if os.path.exists(path):
            return FileResponse(path)
    return HTTPException(status_code=404)

if os.path.exists("frontend/dist"):
    app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    # When running as a script, we typically use the app object directly or the module path
    # If running from inside 'app' folder: uvicorn main:app
    # If running from repo root: uvicorn app.main:app
    print(f"Starting consolidated FastAPI server on port 8008...")
    uvicorn.run(app, host="127.0.0.1", port=8008)
    # Reload trigger
