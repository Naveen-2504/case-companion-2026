import multer from "multer";
import { env } from "../config/env";
import { badRequest } from "../utils/AppError";

export const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxFileSizeBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME[file.mimetype]) return cb(badRequest("Only JPG, PNG, WEBP or PDF files are allowed"));
    cb(null, true);
  },
});

/** Verify magic bytes so a renamed file cannot bypass the MIME check. */
export function verifyMagicBytes(buf: Buffer, mime: string): boolean {
  const hex = buf.subarray(0, 12).toString("hex");
  switch (mime) {
    case "image/jpeg": return hex.startsWith("ffd8ff");
    case "image/png": return hex.startsWith("89504e470d0a1a0a");
    case "image/webp": return hex.startsWith("52494646") && buf.subarray(8, 12).toString() === "WEBP";
    case "application/pdf": return buf.subarray(0, 5).toString() === "%PDF-";
    default: return false;
  }
}
