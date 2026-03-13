# 🧬 Decision DNA

**AI Governance & Monitoring System for Credit Risk Models**

![React](https://img.shields.io/badge/React-19-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/license-MIT-purple)

Decision DNA is an **AI governance and monitoring platform** designed to supervise machine learning models used in credit risk decision systems.

The system helps detect **model drift, operational risks, and security threats**, while maintaining transparent and auditable AI decision pipelines.

---

# 🏛️ System Architecture

```text
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
Security Layer
  ↓
Audit Logging System
```

Decision DNA provides **real-time insights into model behavior, prediction monitoring, and governance alerts**.

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

Detects distribution shifts using statistical techniques:

* Population Stability Index (PSI)
* KL Divergence

This helps identify when **production data deviates from training data**.

---

### 🛡️ Security Monitoring

Provides monitoring mechanisms to detect:

* abnormal model behavior
* suspicious system activity
* operational failures

Security events are logged for auditing.

---

### 🤖 Risk Prediction Interface

Interactive interface to test credit risk predictions using trained models.

---

### 📋 Audit Logging

All governance events and system activities are stored as **timestamped audit logs**.

---

### 🔄 Recovery & Reboot System

Administrative tools allow safe restart or recovery of model services when anomalies occur.

---

# 🏗️ Tech Stack

| Layer      | Technology                        |
| ---------- | --------------------------------- |
| Frontend   | React + TypeScript + Tailwind CSS |
| Backend    | Node.js + Express                 |
| Build Tool | Vite                              |
| ML         | Python + scikit-learn             |
| Validation | Zod                               |
| Storage    | IndexedDB / local logs            |

---

# 📁 Project Structure

```text
Decision-DNA/
│
├── screenshots/          # UI screenshots for README
│
├── src/
│   ├── api/              # API client layer
│   ├── config/           # configuration files
│   ├── drift/            # drift detection logic
│   ├── pages/            # React UI pages
│   ├── services/         # backend services
│
│   ├── App.tsx
│   ├── ai_report.ts
│   ├── constants.tsx
│   ├── index.css
│   └── index.tsx
│
├── ml/                   # ML training pipeline
├── scripts/              # automation scripts
├── security/             # security monitoring modules
├── tests/                # testing files
│
├── server.ts             # Express backend server
│
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
│
├── .env.example          # environment variables template
├── .gitignore
├── SECURITY.md
└── README.md
```

---

# 📊 Dataset

The system uses a **synthetic credit risk dataset** for training and demonstration.

Example features:

| Feature     | Description                  |
| ----------- | ---------------------------- |
| creditScore | Credit score range (300–850) |
| income      | Annual applicant income      |
| debtRatio   | Debt-to-income ratio         |
| loanAmount  | Requested loan amount        |
| decision    | Loan approval outcome        |

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

Create `.env.local`:

```env
API_KEY=your_api_key
```

---

### 4️⃣ Start the development server

```bash
npm run dev
```

This launches:

* Express backend
* React dashboard

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
| npm run lint    | Type checking            |

---

# 🔐 Security Policy

Security guidelines and reporting instructions are available in:

```
SECURITY.md
```

---

# 📈 Future Improvements

Possible enhancements include:

* automated model retraining
* real-time drift alerts
* anomaly detection
* explainable AI modules
* cloud deployment

---

# 👨‍💻 Author

**Harshit Ranbhare**

AI / Machine Learning Student
Btech IT Student 

---

# 📄 License

MIT License © 2024 Harshit-it25

---

⭐ If you found this project interesting, consider **starring the repository**.
