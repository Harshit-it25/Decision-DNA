---
title: Decision DNA
emoji: 🧬
colorFrom: red
colorTo: gray
sdk: docker
app_port: 7860
pinned: false
---

<h1 align="center">🧬 Decision DNA</h1>
<h1 align="center">Decision Dynamics, Navigation & Assurance</h1>
<p align="center"><strong>Production-Grade AI Governance & Monitoring Platform for Credit Risk Models</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-3.0-009688?logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/scikit--learn-ML-F7931E?logo=scikitlearn&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/Terraform-GCP%20%7C%20AWS-844FBA?logo=terraform&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

<p align="center">
  <strong>🚀 Live Demo: <a href="https://huggingface.co/spaces/Harshit18930/Decision-DNA">huggingface.co/spaces/Harshit18930/Decision-DNA</a></strong>
</p>

---

**Decision DNA (Decision Dynamics, Navigation & Assurance)** is an enterprise-scale credit risk AI system that goes far beyond prediction — it governs, monitors, secures, and explains every model decision in real time. Built for institutions that need to trust their AI, it combines high-fidelity machine learning (~88% accuracy) with a full governance stack: drift detection, adversarial robustness, fairness auditing, SHAP-based explainability, and an immutable audit trail — all deployable to GCP or AWS with a single command.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [System Architecture](#️-system-architecture)
- [Tech Stack](#️-tech-stack)
- [ML Models & Performance](#-ml-models--performance)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
- [Security & RBAC](#-security--rbac)
- [Governance Modules](#-governance-modules)
- [Cloud Deployment](#-cloud-deployment)
- [Screenshots](#-screenshots)
- [License](#-license)

---

## ✨ Key Features

**Production ML Engine**
Two models power every decision: a Random Forest (88.35% accuracy) serving as the production engine and a Logistic Regression (87.77% accuracy) used as a stability monitor. Both are trained on a 100,000-sample synthetic credit dataset with features including income, credit score, debt-to-income ratio, credit utilization, payment history, and loan repayment ratio.

**Real-Time Governance Dashboard**
A React SPA gives risk officers a live view of model health — predictions, drift scores, fairness metrics, and security events — all updating in real time without a page refresh.

**Self-Healing MLOps**
When Population Stability Index (PSI) drift crosses the alert threshold, the system automatically triggers background retraining via `RobustTrainer` and hot-reloads the new model without downtime.

**Fairness & Bias Auditing**
Algorithmic auditing across gender (Male/Female/Other) and age cohorts (18–25, 26–40, 41–60, 60+) using Disparate Impact ratio and Statistical Parity Difference. Flags violations of the four-fifths rule.

**Adversarial Robustness**
Greedy bidirectional adversarial search identifies minimal input perturbations that flip model decisions. Adversarial examples are folded back into training data to harden the model.

**Explainability Engine**
SHAP values provide per-feature attribution for every prediction, surfaced as ranked feature importance charts. Counterfactual "what-if" guidance shows applicants the minimum changes needed to flip their decision.

**Enterprise Security**
JWT/OAuth2 authentication, role-based access control, cryptographic model fingerprinting (SHA-256), model watermarking, rate limiting, Prometheus metrics, and a full prompt-injection defence layer.

**Cloud-Native Infrastructure**
One-click deployment to Google Cloud Run or AWS Fargate via Terraform. GitHub Actions CI/CD pipeline included.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     React Frontend (SPA) (port 8007)                │
│   Dashboard │ Monitoring │ Explainability │ Fairness │ Security │ Audit │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ HTTPS / JWT Auth / Vite Proxy
┌────────────────────────────────▼────────────────────────────────────┐
│                     FastAPI Backend  (port 8008)                    │
│                                                                     │
│   /api/predict          /api/audit/fairness    /api/security/       │
│   /api/monitor/drift    /api/explain           /api/retrain         │
│   /api/token            /api/models            /metrics (Prometheus)│
└──────┬──────────────────────┬────────────────────────┬─────────────┘
       │                      │                        │
┌──────▼──────┐    ┌──────────▼──────────┐  ┌─────────▼──────────────┐
│  ML Layer   │    │   Governance Layer  │  │   Security Layer       │
│             │    │                     │  │                        │
│ RandomForest│    │ PSI Drift Detector  │  │ SHA-256 Fingerprinting │
│ LogisticReg │    │ KL-Divergence       │  │ Adversarial Tester     │
│ SHAP Explnr │    │ Spearman Rank       │  │ Watermarker            │
│ DataProcess │    │ Fairness Auditor    │  │ RBAC Middleware        │
│ RobustTrainr│    │ Retraining Pipeline │  │ Rate Limiting          │
└─────────────┘    └─────────────────────┘  └────────────────────────┘
```

**Data flow:** Applicant data enters via the React frontend → JWT-authenticated FastAPI backend → ML prediction with SHAP attribution → Drift and security checks → Plain-English explanation generated → Immutable audit log entry.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS, Recharts, Lucide Icons, Motion |
| **Backend** | Python 3.11, FastAPI 3, Uvicorn, Pydantic v2 |
| **ML / DS** | scikit-learn, SHAP, Pandas, NumPy, joblib |
| **AI / NLP** | Google Gemini API (`@google/genai`) |
| **Auth** | JWT (PyJWT), OAuth2 Password Flow, SHA-256 RBAC |
| **Local Storage** | Dexie (IndexedDB) — client-side audit log persistence |
| **Monitoring** | Prometheus (`prometheus-fastapi-instrumentator`) |
| **Infra** | Docker, Docker Compose, Terraform (GCP Cloud Run + AWS Fargate) |
| **CI/CD** | GitHub Actions |
| **Cryptography** | Python `cryptography` library — model watermarking & fingerprinting |

---

## 🤖 ML Models & Performance

Both models are trained on a 100,000-sample synthetic credit dataset.

| Model | Accuracy | Role |
|---|---|---|
| Random Forest | **88.35%** | Production — primary decision engine |
| Logistic Regression | **87.77%** | Monitor — stability & drift reference |

**Input features:**

| Feature | Description |
|---|---|
| `income` | Annual applicant income |
| `loanAmount` | Requested loan size |
| `creditScore` | FICO-style credit score |
| `debt_to_income` | Total debt relative to income |
| `credit_utilization` | Share of available credit in use |
| `payment_history_score` | Historical on-time payment rating |
| `loan_repayment_ratio` | Existing repayment obligations vs income |

**Drift metrics tracked:** Population Stability Index (PSI), KL-Divergence, Spearman Rank Correlation, Kolmogorov-Smirnov statistic, Decision Flip Rate.

---

## 📁 Project Structure

```
decision-dna/
│
├── app/
│   ├── main.py                   # FastAPI application — all API routes
│   ├── db.py                     # Unified Database Manager (MySQL + SQLite/CSV fallback)
│   └── encryption_layer.py       # Encryption utilities
│
├── ml/
│   ├── train_models_prod.py      # Training entry point
│   ├── robust_trainer.py         # Adversarial-augmented retraining
│   ├── data_processor.py         # Feature engineering & scaling
│   ├── dataset_generator.py      # Synthetic dataset generation
│   ├── fairness_auditor.py       # Disparate Impact & SPD metrics
│   ├── adversarial_tester.py     # Greedy adversarial perturbation
│   ├── watermarker.py            # Cryptographic model watermarking
│   ├── retraining_pipeline.py    # Automated retraining pipeline
│   └── spark_processor.py        # Large-scale data processing
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx         # Live model health overview
│   │   │   ├── MonitoringCenter.tsx  # Drift metrics & alerts
│   │   │   ├── Explainability.tsx    # SHAP + Gemini explanations
│   │   │   ├── FairnessAudit.tsx     # Disparate Impact / SPD charts
│   │   │   ├── SecurityCenter.tsx    # Threat monitoring
│   │   │   ├── SecurityHardening.tsx # Adversarial hardening UI
│   │   │   ├── ModelManagement.tsx   # Model registry & versioning
│   │   │   └── AuditTimeline.tsx     # Immutable audit trail
│   │   ├── drift/
│   │   │   └── driftDetector.ts      # PSI + Spearman calculation (client)
│   │   ├── services/
│   │   │   ├── modelEngine.ts        # ML inference bridge
│   │   │   ├── simulationEngine.ts   # Scenario simulation
│   │   │   ├── geminiService.ts      # Gemini API client
│   │   │   ├── monitoringService.ts  # Monitoring data fetch
│   │   │   └── db.ts                 # Dexie IndexedDB wrapper
│   │   ├── api/
│   │   │   └── modelApi.ts           # Typed API client layer
│   │   ├── components/
│   │   │   └── ReportModal.tsx        # PDF/export report modal
│   │   ├── App.tsx                    # Root component & router
│   │   └── types.ts                   # Shared TypeScript types
│   └── package.json
│
├── models/
│   ├── random_forest_model_prod.pkl   # Production RF model
│   ├── logistic_model_prod.pkl        # Monitor LR model
│   ├── scaler_prod.pkl                # Feature scaler
│   ├── model_metrics_prod.json        # Accuracy, precision, recall, F1, ROC-AUC
│   └── model_metadata.json            # Version & training metadata
│
├── scripts/
│   ├── seed_mysql.py           # Database schema initialization and CSV seeding
│   ├── run_pipeline_demo.py    # Full pipeline demo
│   ├── stress_test.py          # Load & stress testing
│   ├── test_rbac.py            # RBAC role testing
│   ├── stream_simulator.py     # Live data stream simulation
│   ├── verify_prod_api.py      # Production API health check
│   ├── deploy_aws.ps1          # AWS Fargate deployment
│   └── deploy_gcp.ps1 / .sh    # GCP Cloud Run deployment
│
├── terraform/
│   ├── main.tf                 # Cloud infrastructure definition
│   ├── variables.tf
│   └── outputs.tf
│
├── tests/
│   ├── driftDetector.test.ts
│   ├── modelEngine.test.ts
│   └── simulationEngine.test.ts
│
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── .env.example
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- Docker (optional, for containerised run)

### 1. Clone & configure environment

```bash
git clone https://github.com/Harshit-it25/Decision-DNA.git
cd Decision-DNA
cp .env.example .env
# Edit .env — add your GEMINI_API_KEY
```

### 2. Setup and Run (Concurrent Dev Mode)

You can set up and run both the frontend and backend concurrently using the root package scripts:

```bash
# Install all dependencies (virtual environment & npm packages)
npm run setup

# Start both backend (port 8008) and frontend (port 8007) concurrently
npm start
```

The React dashboard will automatically open at **http://localhost:8007**, and the API docs (Swagger UI) will be available at **http://localhost:8008/docs**.

### 3. Running Services Separately

If you prefer to run services in separate terminals:

**Backend (FastAPI)**
```bash
# If using the virtual environment created by npm run setup:
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Unix/macOS

python -m uvicorn app.main:app --host 127.0.0.1 --port 8008 --reload
```
Interactive API docs (Swagger UI) will be available at **http://localhost:8008/docs**.

**Frontend (React + Vite)**
```bash
cd frontend
npm install
npm run dev
```
The dashboard will open at **http://localhost:8007**.

### 4. Docker (all-in-one)

```bash
docker-compose up --build
```

The API will be available at **http://localhost:8008**.

---

## 📡 API Reference

All protected endpoints require a `Bearer` JWT token obtained from `/api/token`.

### Authentication

```
POST /api/token
```
OAuth2 password flow. Returns a JWT access token (30-minute expiry).

**Default credentials:**

| Username | Password | Role |
|---|---|---|
| `admin` | `decision_dna_2024` | SECURITY_ADMIN |
| `officer` | `officer_pass_2024` | MORTGAGE_OFFICER |
| `auditor` | `auditor_pass_2024` | AUDITOR |

### Core Endpoints

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `POST` | `/api/predict` | Run a credit risk prediction with SHAP attribution | MORTGAGE_OFFICER+ |
| `GET` | `/api/monitoring-drift` | Current PSI, KL-Divergence, and drift status | AUDITOR+ |
| `GET` | `/api/audit/fairness` | Disparate Impact & SPD fairness metrics | AUDITOR+ |
| `GET` | `/api/audit/explain/{applicant_id}` | SHAP feature importances for a specific applicant | AUDITOR+ |
| `POST` | `/api/audit/explain` | Counterfactuals & SHAP explanations for provided applicant data | MORTGAGE_OFFICER+ |
| `GET` | `/api/security/status` | Threat level & model integrity status | SECURITY_ADMIN |
| `POST` | `/api/security/harden` | Trigger adversarial hardening run | SECURITY_ADMIN |
| `POST` | `/api/train-model` | Manually trigger model retraining | SECURITY_ADMIN |
| `GET` | `/api/models` | List model registry with versions & metrics | AUDITOR+ |
| `GET` | `/metrics` | Prometheus metrics scrape endpoint | — |

### Example — Credit Risk Prediction

```bash
curl -X POST https://harshit18930-decision-dna.hf.space/api/predict \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "applicant": {
      "income": 75000,
      "debtRatio": 0.32,
      "creditScore": 720,
      "loanAmount": 25000,
      "monthsEmployed": 24,
      "numCreditLines": 5,
      "totalBalance": 5000,
      "totalCreditLimit": 20000,
      "pastDuePayments": 0,
      "gender": "Male",
      "age": 30
    },
    "modelId": "m2"
  }'
```

```json
{
  "riskProbability": 0.1400,
  "decision": "Approve",
  "confidence": 0.8600,
  "explanations": {
    "creditScore": -0.3100,
    "income": -0.2200,
    "debtRatio": 0.1800
  },
  "reason": "Decision: Approve. Key factors: strong Credit Score, strong Income.",
  "modelId": "m2",
  "mitigation_context": {
    "active": false,
    "applied_threshold": 0.65
  },
  "emailSent": false
}
```

---

## 🔐 Security & RBAC

Decision DNA uses a layered security model:

**Authentication & Authorisation**
All API routes are protected by JWT Bearer tokens issued through the OAuth2 password flow. Three roles are defined, each with a scoped set of permitted actions:

| Role | Permitted Actions |
|---|---|
| `SECURITY_ADMIN` | predict, audit, harden, monitor |
| `MORTGAGE_OFFICER` | predict, monitor |
| `AUDITOR` | monitor |

**Model Integrity**
Every model file has a SHA-256 cryptographic fingerprint stored at load time. The `/api/security/status` endpoint re-hashes the model on demand and reports `Verified` or `Compromised`. Model watermarking encodes a unique identity into weights to detect unauthorised copying.

**Adversarial Defence**
The `AdversarialTester` uses a greedy bidirectional search to find minimal feature perturbations that flip decisions. These examples are merged back into training data by `RobustTrainer` with their original labels, teaching the model to maintain stable decisions under adversarial pressure.

**Operational Hardening**

- Rate limiting: 100 requests / 15 minutes per IP
- All inputs validated with Pydantic schemas
- CORS configured for production origins
- Prometheus metrics for operational observability at `/metrics`

> ⚠️ **Important:** The `SECRET_KEY` in `app/main.py` and the `.env` API key are placeholders for development. Replace both with cryptographically strong random values before any production deployment.

---

## 📊 Governance Modules

### Drift Detection

The `driftDetector.ts` (frontend) and backend monitoring endpoints track five signals continuously:

| Metric | What it measures | Alert threshold |
|---|---|---|
| PSI (Population Stability Index) | Distribution shift in risk scores | > 0.2 |
| KL-Divergence | Information-theoretic distribution divergence | Configurable |
| Spearman Rank Correlation | Rank-order stability: credit score vs. model risk | < 0.7 |
| KS Statistic | Two-sample distribution test | Configurable |
| Flip Rate | Share of predictions changing in a rolling window | > 5% |

When PSI exceeds threshold, the system automatically enqueues a background retraining job.

### Fairness Auditing

The `FairnessAudit` page and `/api/audit/fairness` endpoint compute two standard fairness metrics across **gender** (Male, Female, Other) and **age** cohorts (18–25, 26–40, 41–60, 60+):

**Disparate Impact (DI):** Ratio of approval rates between unprivileged and privileged groups. Values below **0.8** trigger the four-fifths rule violation flag.

**Statistical Parity Difference (SPD):** Absolute difference in approval rates. Values outside **±0.1** are flagged as potentially discriminatory.

The mitigation layer can apply per-group decision thresholds to bring metrics within acceptable bounds.

### Explainability Engine

Every prediction is accompanied by:

1. **SHAP Values** — per-feature attribution scores computed on the live model, shown as a ranked bar chart in the Explainability page.
2. **Counterfactuals** — the minimum changes an applicant could make to flip their decision (e.g. "Increase credit score by 40 points").
3. **Gemini Narrative** — a plain-English explanation of the decision synthesised by the Google Gemini API, suitable for regulatory audit documentation.

---

## ☁️ Cloud Deployment

### Docker Compose (local / staging)

```bash
docker-compose up --build
# API on :8008
```

### Google Cloud Run

```bash
# Authenticate and set project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Deploy via script
./scripts/deploy_gcp.sh
```

Or with Terraform:

```bash
cd terraform
terraform init
terraform plan -var="project_id=YOUR_PROJECT_ID"
terraform apply
```

### AWS Fargate

```powershell
# Windows
.\scripts\deploy_aws.ps1
```

The Terraform configuration in `terraform/main.tf` provisions the container registry, service, and IAM roles for both GCP and AWS targets.

---

## 🧪 Testing

```bash
# Backend — type check
mypy app/ ml/

# Frontend — unit tests (Vitest)
cd frontend
npm run test

# API stress test
python scripts/stress_test.py

# RBAC role validation
python scripts/test_rbac.py

# Production API health check
python scripts/verify_prod_api.py
```

---

## 🖼️ Screenshots

| Dashboard | Monitoring Center |
|---|---|
| ![Dashboard](Screenshots/dashboard.png) | ![Monitoring](Screenshots/monitoring.png) |

| Explainability | Fairness Audit |
|---|---|
| ![Explainability](Screenshots/explainability.png) | ![Fairness](Screenshots/fairness.png) |

| Security Center | Audit Timeline |
|---|---|
| ![Security](Screenshots/security.png) | ![Audit](Screenshots/audit.png) |

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">
  <p>Built with FastAPI, React, scikit-learn, SHAP, and Google Gemini AI</p>
  <p><strong>Developed by:</strong> Harshit Ranbhare (B.Tech IT, AIML Engineer)</p>
  <p>
    <a href="https://github.com/Harshit-it25/Decision-DNA/issues">Report Bug</a> ·
    <a href="https://github.com/Harshit-it25/Decision-DNA/issues">Request Feature</a>
  </p>
</div>