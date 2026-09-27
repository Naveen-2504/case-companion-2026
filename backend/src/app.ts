import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { casesRouter } from "./routes/cases.routes";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({
    origin: (origin, cb) => (!origin || env.corsOrigins.includes(origin) ? cb(null, true) : cb(new Error("CORS"))),
    methods: ["GET", "POST", "PUT", "DELETE"],
  }));
  app.use(rateLimit({ windowMs: env.RATE_LIMIT_WINDOW_MS, limit: env.RATE_LIMIT_MAX, standardHeaders: "draft-7", legacyHeaders: false }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.get("/api/config", (_req, res) => res.json({ maxFileSizeMb: env.MAX_FILE_SIZE_MB, maxDocuments: env.MAX_DOCUMENTS }));
  app.use("/api/cases", casesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
