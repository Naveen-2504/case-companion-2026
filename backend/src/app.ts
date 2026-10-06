import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { casesRouter } from "./routes/cases.routes";

export function createApp() {
  const app = express();
  const allowedOrigins = (
  process.env.CORS_ORIGINS ?? ""
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  const allowAllOrigins = allowedOrigins.includes("*");
  app.use(helmet());

app.use(
  cors({
origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowAllOrigins || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error(`CORS blocked origin: ${origin}`);

      return callback(new Error("CORS"));
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  }),
);
  app.use(rateLimit({ windowMs: env.RATE_LIMIT_WINDOW_MS, limit: env.RATE_LIMIT_MAX, standardHeaders: "draft-7", legacyHeaders: false }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.get("/api/config", (_req, res) => res.json({ maxFileSizeMb: env.MAX_FILE_SIZE_MB, maxDocuments: env.MAX_DOCUMENTS }));
  app.use("/api/cases", casesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
