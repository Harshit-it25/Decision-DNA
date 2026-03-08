<div align="center">

# 🧬 Decision DNA

**AI Governance & Monitoring System for Credit Risk Models**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript) ![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite) ![Express](https://img.shields.io/badge/Express-5-000000?logo=express) ![Gemini](https://img.shields.io/badge/Gemini_AI-Google-4285F4?logo=google)

</div>

---

Decision DNA is an enterprise-grade AI governance platform that secures and monitors credit risk models in real time — detecting **model drift**, **tampering**, and **operational risks** before they impact financial outcomes.

---

## 🏛️ System Architecture

![Architecture Diagram](screenshots/architecture.jpeg)

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
- 🧪 **Model Management** — Registry for managing and versioning credit risk models
- ⚡ **Rate Limiting & API Key Auth** — Hardened Express backend with input validation via Zod

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS, Recharts, Motion |
| Backend | Node.js, Express 5, tsx |
| AI | Google Gemini API (`@google/genai`) |
| Local DB | Dexie (IndexedDB) |
| Validation | Zod |
| Build | Vite 6 |

---

## 📁 Project Structure

```
decision-dna/
├── screenshots/                  # App screenshots & architecture diagram
├── pages/                        # Full-page React views
│   ├── Dashboard.tsx
│   ├── ModelManagement.tsx
│   ├── MonitoringCenter.tsx
│   ├── SecurityCenter.tsx
│   ├── Explainability.tsx
│   └── AuditTimeline.tsx
├── components/                   # Reusable UI components
├── api/                          # Frontend API client layer
├── services/                     # Backend business logic
├── drift/                        # PSI & KL-Divergence calculations
├── security/                     # Tamper & adversarial detection
├── models/                       # Model version registry
├── logs/                         # Audit & system logs
├── config/                       # Environment configuration
├── tests/                        # Test files
├── App.tsx
├── server.ts
├── index.tsx
└── vite.config.ts
```

---

## 🔐 Security Architecture

- **API Key Middleware** — All API routes require a valid `x-api-key` header
- **Rate Limiting** — 100 requests per 15-minute window per IP
- **Input Validation** — All inputs validated with Zod schemas
- **Model Integrity** — Cryptographic fingerprints detect weight tampering
- **Prompt Injection Detection** — Guards against adversarial inputs
- **Audit Trail** — Immutable timestamped logs of all governance events

---

## 🧪 Testing

```bash
npm run lint        # TypeScript type checking
npm run test        # Run tests
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
