import { randomUUID } from "crypto";
import { bucket } from "../config/firebase";
import { ALLOWED_MIME } from "../middleware/upload";

export interface DocumentMeta {
  slot: number;
  path: string;
  fileName: string;
  originalName: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

const safeName = (s: string) => s.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 100);

export async function uploadDocument(caseId: string, slot: number, file: Express.Multer.File): Promise<DocumentMeta> {
  const ext = ALLOWED_MIME[file.mimetype];
  const fileName = `${Date.now()}-${randomUUID()}.${ext}`;
  const path = `patient-cases/${caseId}/documents/${fileName}`;
  await bucket.file(path).save(file.buffer, {
    resumable: false,
    contentType: file.mimetype,
    metadata: { cacheControl: "private, max-age=0", contentDisposition: `inline; filename="${safeName(file.originalname)}"` },
  });
  return {
    slot, path, fileName,
    originalName: safeName(file.originalname),
    contentType: file.mimetype,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };
}

/** Never throws — orphaned objects are logged, not surfaced to users. */
export async function deleteObject(path: string | undefined) {
  if (!path || !path.startsWith("patient-cases/")) return;
  try {
    await bucket.file(path).delete({ ignoreNotFound: true });
  } catch (e) {
    console.warn("[storage] failed to delete", path, (e as Error).message);
  }
}

export async function deleteCaseFolder(caseId: string) {
  try {
    await bucket.deleteFiles({ prefix: `patient-cases/${caseId}/` });
  } catch (e) {
    console.warn("[storage] failed to delete folder", caseId, (e as Error).message);
  }
}

/** Short-lived signed URL; bucket stays private. */
export async function signedUrl(path: string): Promise<string | null> {
  try {
    const [url] = await bucket.file(path).getSignedUrl({ action: "read", expires: Date.now() + 60 * 60 * 1000, version: "v4" });
    return url;
  } catch (e) {
    console.warn("[storage] signed url failed", (e as Error).message);
    return null;
  }
}
