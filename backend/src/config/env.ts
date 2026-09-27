import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(8081),
  NODE_ENV: z.string().default("development"),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().min(1, "FIREBASE_STORAGE_BUCKET is required"),
  MAX_FILE_SIZE_MB: z.coerce.number().positive().default(10),
  MAX_DOCUMENTS: z.coerce.number().int().positive().default(4),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(300),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // Only field names are printed, never values.
  console.error("Invalid environment:", Object.keys(parsed.error.flatten().fieldErrors));
  throw new Error("Invalid server environment configuration");
}

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean),
  maxFileSizeBytes: parsed.data.MAX_FILE_SIZE_MB * 1024 * 1024,
  isProd: parsed.data.NODE_ENV === "production",
};
