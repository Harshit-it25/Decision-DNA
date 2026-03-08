
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Security Configuration ---

// 1. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "error", message: "Too many requests, please try again later." }
});

// 2. API Key Middleware
const apiKeyMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY || 'decision_dna_secret_key_2024';

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({ status: "error", message: "Unauthorized: Invalid or missing API key." });
  }
  next();
};

// 3. Input Validation Schemas
const PredictRiskSchema = z.object({
  applicant: z.object({
    id: z.string().optional(),
    name: z.string().min(2),
    income: z.number().positive(),
    debtRatio: z.number().min(0).max(1),
    creditScore: z.number().min(300).max(850),
    loanAmount: z.number().positive()
  }),
  modelId: z.string()
});

const SecurityAttackSchema = z.object({
  type: z.enum(['INCOME_INFLATION', 'DATA_POISONING', 'FEATURE_MASKING', 'CUSTOM'])
});

const TrainModelSchema = z.object({
  architecture: z.string(),
  epochs: z.number().int().positive().max(100),
  learningRate: z.number().positive().max(1)
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global Middleware
  app.use(express.json());
  app.use(limiter); // Apply rate limiting to all routes

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // Apply API Key protection to sensitive endpoints
  app.use("/api/system-info", apiKeyMiddleware);
  app.use("/api/models", apiKeyMiddleware);
  app.use("/api/predict-risk", apiKeyMiddleware);
  app.use("/api/security-status", apiKeyMiddleware);
  app.use("/api/security-attack", apiKeyMiddleware);
  app.use("/api/train-model", apiKeyMiddleware);
  app.use("/api/monitoring-drift", apiKeyMiddleware);
  app.use("/api/monitoring-performance", apiKeyMiddleware);
  app.use("/api/forensics", apiKeyMiddleware);
  app.use("/api/audit-logs", apiKeyMiddleware);

  app.get("/api/system-info", (req, res) => {
    res.json({
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      env: process.env.NODE_ENV || 'development'
    });
  });

  // Model API
  app.get("/api/models", (req, res) => {
    res.json({
      status: "success",
      data: [
        { id: 'm1', type: 'Logistic Regression', version: '1.0.0', status: 'Stable Baseline' },
        { id: 'm2', type: 'Random Forest', version: '1.0.1', status: 'Active' }
      ]
    });
  });

  app.post("/api/predict-risk", (req, res) => {
    try {
      const validatedData = PredictRiskSchema.parse(req.body);
      const { modelId } = validatedData;
      
      // Simulation of model prediction
      const score = Math.random();
      res.json({
        riskProbability: score,
        decision: score < 0.4 ? 'Approve' : 'Reject',
        modelId
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ status: "error", message: "Validation failed", errors: (error as any).errors });
      }
      res.status(500).json({ status: "error", message: "Internal server error" });
    }
  });

  // Security API
  app.get("/api/security-status", (req, res) => {
    res.json({
      threatLevel: 'Low',
      integrity: 'Verified',
      lastScan: Date.now()
    });
  });

  app.post("/api/security-attack", (req, res) => {
    try {
      const { type } = SecurityAttackSchema.parse(req.body);
      res.json({
        status: "alert",
        message: `Simulated ${type} attack detected and mitigated.`,
        timestamp: Date.now()
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ status: "error", message: "Validation failed", errors: (error as any).errors });
      }
      res.status(500).json({ status: "error", message: "Internal server error" });
    }
  });

  app.post("/api/train-model", (req, res) => {
    try {
      const config = TrainModelSchema.parse(req.body);
      res.json({
        status: "success",
        message: "Model training initiated",
        jobId: Math.random().toString(36).substring(7),
        estimatedTime: "45s"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ status: "error", message: "Validation failed", errors: (error as any).errors });
      }
      res.status(500).json({ status: "error", message: "Internal server error" });
    }
  });

  // Monitoring API
  app.get("/api/monitoring-drift", (req, res) => {
    res.json({
      psi: 0.042,
      klDivergence: 0.015,
      status: 'Stable',
      timestamp: Date.now()
    });
  });

  app.get("/api/monitoring-performance", (req, res) => {
    res.json({
      latency: "12ms",
      throughput: "450 req/s",
      errorRate: "0.01%",
      uptime: "99.99%"
    });
  });

  app.get("/api/forensics", (req, res) => {
    res.json([
      { id: 'f1', type: 'Adversarial', severity: 'Low', details: 'Unusual feature perturbation detected in sample #452' },
      { id: 'f2', type: 'Integrity', severity: 'None', details: 'Model hash verified successfully' }
    ]);
  });

  app.get("/api/audit-logs", (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    res.json({
      count: 0,
      logs: [] // In a real app, fetch from DB
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Decision DNA] Server running on http://localhost:${PORT}`);
  });
}

startServer();
