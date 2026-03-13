# 🧬 Decision DNA

**AI Governance & Monitoring System for Credit Risk Models**

![React](https://img.shields.io/badge/React-19-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/license-MIT-purple)

Decision DNA is an **AI governance and monitoring platform** designed to supervise machine learning models used in credit risk decision systems.

The system monitors **model performance, detects data drift, tracks security threats, and maintains audit logs** to ensure that automated financial decisions remain transparent, stable, and trustworthy.

---

# 🏛️ System Architecture

```
User
  ↓
React Governance Dashboard
  ↓
Express API Layer
  ↓
Model Monitoring Engine
  ↓
Drift Detection (PSI / KL Divergence)
  ↓
Security Layer (Tamper Detection)
  ↓
Audit Logging System
```

The platform provides **real-time insights into model behavior, security status, and prediction monitoring**.

---

# ✨ Features

### 📊 Live Governance Dashboard

Real-time monitoring of:

* model health
* prediction activity
* system alerts
* governance metrics

---

### 🔍 Model Drift Detection

Detects changes in data distribution using:

* **Population Stability Index (PSI)**
* **KL Divergence**

This helps identify when production data deviates from training data.

---

### 🛡️ Model Security Monitoring

Monitors the integrity and operational state of deployed models.

Provides alerts for potential system or model anomalies.

---

### 🤖 Risk Prediction Interface

Interactive UI to test credit risk predictions using trained models.

---

### 📋 Audit Logging

All governance actions and model events are recorded in **timestamped logs** for traceability.

---

### 🔄 System Recovery

Built-in recovery module allows administrators to **restart or recover model services** if system anomalies occur.

---

# 🏗️ Tech Stack

| Layer      | Technology                        |
| ---------- | --------------------------------- |
| Frontend   | React + TypeScript + Tailwind CSS |
| Backend    | Express                           |
| Build Tool | Vite                              |
| AI / ML    | scikit-learn                      |
| Validation | Zod                               |
| Storage    | IndexedDB / local logging         |

---

# 📁 Project Structure

```
decision-dna/
│
├── src/
│   ├── index.tsx
│   ├── App.tsx
│   │
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── ModelMonitor.tsx
│   │   ├── SecurityPanel.tsx
│   │   ├── RiskPredictor.tsx
│   │   ├── AuditLogs.tsx
│   │   └── RebootRecovery.tsx
│   │
│   └── types/
│       └── index.ts
│
├── models/            # generated model artifacts (gitignored)
├── logs/              # system logs (gitignored)
│
├── server.ts          # Express backend
├── dataset.csv        # training dataset
│
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
│
├── metadata.json
├── README.md
├── .env.example
├── .env.local         # not committed
└── .gitignore
```

---

# 📊 Dataset

`dataset.csv` contains **synthetic credit applicant records** used for model training and experimentation.

| Feature     | Description                  |
| ----------- | ---------------------------- |
| creditScore | Credit score between 300–850 |
| income      | Annual income                |
| debtRatio   | Debt-to-income ratio         |
| loanAmount  | Requested loan amount        |
| decision    | Loan approval decision       |

---

# 🚀 Quick Start

### 1️⃣ Clone the repository

```bash
git clone https://github.com/Harshit-it25/Decision-DNA.git
cd Decision-DNA
```

---

### 2️⃣ Install dependencies

```bash
npm install
```

---

### 3️⃣ Configure environment variables

Create `.env.local` in the project root.

```
API_KEY=your_secure_api_key
```

---

### 4️⃣ Start the development server

```bash
npm run dev
```

This will start:

* Express backend
* React dashboard (Vite)

---

### 5️⃣ Open the application

```
http://localhost:5173
```

---

# 📦 Available Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| npm run dev     | Start development server |
| npm run build   | Build production bundle  |
| npm run preview | Preview production build |
| npm run lint    | TypeScript validation    |

---

# 🔐 Security Architecture

The platform includes several safety mechanisms:

* API key authentication
* input validation
* monitoring of model operations
* system audit logging
* operational recovery mechanisms

---

# 📈 Future Improvements

Potential extensions include:

* automated model retraining
* real-time drift alerts
* explainable AI modules
* anomaly detection
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
