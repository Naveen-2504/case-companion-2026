import type { ErrorRequestHandler, RequestHandler } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";

export const notFoundHandler: RequestHandler = (_req, res) =>
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: { code: "VALIDATION", message: "Invalid input", details: err.flatten().fieldErrors } });
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "File is too large" : "Invalid upload";
    return res.status(400).json({ error: { code: err.code, message } });
  }
  // Log server-side only, never return stack or internals.
  console.error("[unhandled]", err?.message ?? err);
  return res.status(500).json({ error: { code: "INTERNAL", message: "Something went wrong" } });
};

export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
