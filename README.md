# 🧬 Decision DNA

**AI Governance & Monitoring System for Credit Risk Models**

![React](https://img.shields.io/badge/React-19-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/license-MIT-purple)

Decision DNA is an **AI governance and monitoring platform** designed to supervise machine learning models used in credit risk decision systems.

The system monitors **model performance, detects distribution drift, tracks security threats, and provides explainable audit trails** to ensure that automated financial decisions remain transparent, stable, and trustworthy.

---

# 🏛️ System Architecture

```
User
  ↓
API Layer (Express)
  ↓
Model Monitoring Layer
  ↓
Drift Detection (PSI / KL Divergence)
  ↓
Security Layer (Tamper Detection)
  ↓
Alert & Logging System
  ↓
Governance Dashboard (React)
```

The **Explainability Layer** uses AI-generated summaries to provide **human-readable explanations of model decisions**.

---

# ✨ Features

### 📊 Live Governance Dashboard

Real-time monitoring of:

* model health
* accuracy metrics
* system security
* prediction statistics

---

### 🔍 Model Drift Detection

Detects distribution shifts using statistical methods:

* **Population Stability Index (PSI)**
* **KL Divergence**

This helps identify when production data diverges from training data.

---

### 🛡️ Model Tamper Detection

Uses **cryptographic SHA-256 fingerprints** to detect unauthorized modifications to trained model artifacts.

---

### 🤖 Adversarial Input Detection

Prevents malicious or manipulated inputs that could exploit the model.

---

### 🧠 Explainability Engine

AI-assisted explanations generate **human-readable summaries** of model decisions to support transparency and auditing.

---

### 🔒 Security Center

Centralized monitoring for:

* API misuse
* model tampering
* anomalous system behavior

---

### 📋 Audit Timeline

Maintains a **timestamped governance log** of system events and model decisions.

---

### 🧪 Model Management

Built-in registry for:

* training models
* version tracking
* production model switching

---

### ⚡ API Security

Backend protections include:

* API key authentication
* rate limiting
* strict input validation

---

# 🏗️ Tech Stack

| Layer      | Technology                        |
| ---------- | --------------------------------- |
| Frontend   | React + TypeScript + Tailwind CSS |
| Backend    | Express                           |
| Build Tool | Vite                              |
| ML         | scikit-learn                      |
| AI         | Google Gemini                     |
| Database   | Dexie.js (IndexedDB)              |
| Validation | Zod                               |

---

# 📁 Project Structure

decision-dna/
│
├── src/
│   ├── index.tsx                  # React entry point
│   ├── App.tsx                    # Root application component
│   │
│   ├── components/                # UI components
│   │   ├── Dashboard.tsx
│   │   ├── ModelMonitor.tsx
│   │   ├── SecurityPanel.tsx
│   │   ├── RiskPredictor.tsx
│   │   ├── AuditLogs.tsx
│   │   └── RebootRecovery.tsx
│   │
│   ├── services/                  # Backend communication + ML logic
│   │   ├── apiClient.ts
│   │   ├── monitoringService.ts
│   │   └── modelService.ts
│   │
│   └── types/
│       └── index.ts               # TypeScript interfaces
│
├── models/                        # Generated trained models (gitignored)
│
├── logs/                          # System + prediction logs (gitignored)
│
├── server.ts                      # Express backend server
├── dataset.csv                    # Credit risk training dataset
│
├── config/                        # Configuration files
│   └── metadata.json
│
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
│
├── README.md
├── .env.example                   # Example environment variables
├── .env.local                     # Local secrets (never commit)
└── .gitignore
---

# 📊 Dataset

The dataset contains **synthetic credit applicant records** used for training and experimentation.

| Feature     | Description                  |
| ----------- | ---------------------------- |
| creditScore | Credit score between 300–850 |
| income      | Annual applicant income      |
| debtRatio   | Debt-to-income ratio         |
| loanAmount  | Requested loan value         |
| decision    | Loan approval result         |

---

# 🚀 Quick Start

Clone the repository:

```bash
git clone https://github.com/Harshit-it25/Decision-DNA.git
cd Decision-DNA
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```
http://localhost:5173
```

---

# 🔐 Security Architecture

The platform includes multiple security mechanisms:

* API key authentication
* Rate limiting (100 requests per 15 minutes)
* Input validation using Zod
* Model integrity verification
* Adversarial input detection
* Immutable audit logging

---

# 📈 Future Improvements

Possible extensions:

* automated model retraining
* real-time model drift alerts
* anomaly detection in predictions
* advanced explainable AI modules
* cloud deployment

---

# 👨‍💻 Author

**Harshit**

AI / Machine Learning Student
Btech IT Student 
GitHub:
[https://github.com/Harshit-it25](https://github.com/Harshit-it25)

---

# 📄 License

MIT License © 2024 Harshit-it25

---

⭐ If you found this project interesting, consider **starring the repository**.
