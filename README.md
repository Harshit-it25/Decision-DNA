

# 🧬 Decision DNA
**AI Governance & Monitoring System for Credit Risk Models**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express)](https://expressjs.com)
[![Gemini](https://img.shields.io/badge/Gemini_AI-Google-4285F4?logo=google)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow)](./LICENSE)
[![Node](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)](https://nodejs.org)

</div>

---

Decision DNA is an enterprise-grade AI governance platform that secures and monitors credit risk models in real time — detecting **model drift**, **tampering**, and **operational risks** before they impact financial outcomes.

---

## 🏛️ System Architecture

![Architecture Diagram](Screenshots/architecture.jpeg)

> **Flow:** User → API Layer → Model Monitoring (PSI Drift Detection) → Security Layer (Fingerprinting + Tamper Detection) → Alert System → Logs. The NLP Explanation Layer (Gemini API) provides human-readable audit logic for every decision.

---

## ✨ Features

- 📊 **Live Dashboard** — Real-time overview of model health, predictions, and risk scores
- 🔍 **Model Drift Detection** — PSI (Population Stability Index) and KL-Divergence tracking to catch distribution shifts
- 🛡️ **Tamper Detection** — Cryptographic fingerprint verification to detect unauthorized model modifications
- 🤖 **Adversarial Detection** — Guards against prompt injection and adversarial input attacks
- 🧠 **Explainability Engine** — AI-powered explanations of model decisions using Google Gemini
- 🔒 **Security Center** — Centralized threat monitoring and security event management
- 📋 **Audit Timeline** — Immutable, timestamped audit trail for full regulatory compliance
- 🧪 **Model Management** — Registry for managing and versioning credit risk models with real ML training
- ⚡ **Rate Limiting & API Key Auth** — Hardened Express backend with input validation via Zod
- 💾 **IndexedDB Persistence** — Client-side storage via Dexie.js for applicants and audit logs

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS, Recharts, Motion |
| Backend | Node.js, Express 5, tsx |
| ML | `ml-logistic-regression`, `ml-random-forest`, `ml-matrix` |
| AI | Google Gemini API (`@google/genai`) |
| Local DB | Dexie.js (IndexedDB) |
| Validation | Zod |
| Build | Vite 6 |

---
## 📁 Project Structure

```
Decision-DNA/
├── Screenshots/                  # App screenshots & architecture diagram
├── pages/                        # Full-page React views
│   ├── Dashboard.tsx
│   ├── ModelManagement.tsx
│   ├── MonitoringCenter.tsx
│   ├── SecurityCenter.tsx
│   ├── Explainability.tsx
│   └── AuditTimeline.tsx
├── components/                   # Reusable UI components
├── api/                          # Frontend API client layer
├── services/                     # DB, Gemini, ModelEngine, Monitoring
├── drift/                        # PSI & KL-Divergence calculations
├── security/                     # Tamper & adversarial detection
├── models/                       # Model version registry (generated at runtime)
├── logs/                         # Audit & system logs
├── config/                       # Environment configuration
├── tests/                        # Test files
├── App.tsx                       # Root component & state management
├── types.ts                      # TypeScript interfaces & enums
├── constants.tsx                 # Mock data & model seeds
├── server.ts                     # Express backend + ML training server
├── dataset.csv                   # Credit risk training dataset
├── index.html
├── index.tsx
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

---

## 🧪 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start full-stack dev server (Express + Vite HMR) |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | TypeScript type checking |

---

## 🔐 Security Architecture

- **API Key Middleware** — All sensitive API routes require a valid `x-api-key` header
- **Rate Limiting** — 100 requests per 15-minute window per IP
- **Input Validation** — All inputs validated with Zod schemas on every endpoint
- **Model Integrity** — Cryptographic SHA-256 fingerprints detect weight tampering
- **Prompt Injection Detection** — Guards against adversarial inputs
- **Audit Trail** — Immutable timestamped logs of all governance events

---

## 📊 Dataset

`dataset.csv` contains synthetic credit applicant records with the following features:

| Feature | Description |
|---------|-------------|
| `creditScore` | 300–850 range |
| `income` | Annual income in USD |
| `debtRatio` | Debt-to-income ratio (0–1) |
| `loanAmount` | Requested loan amount in USD |
| `decision` | `Approve` or `Reject` |

---

## 📄 License

MIT © 2024 [Harshit-it25](https://github.com/Harshit-it25)

MIT License — see [LICENSE](LICENSE) for details.
