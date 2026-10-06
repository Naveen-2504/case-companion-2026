// import { randomUUID } from "crypto";
// import { bucket } from "../config/firebase";
// import { ALLOWED_MIME } from "../middleware/upload";

// export interface DocumentMeta {
//   slot?: number;
//   path?: string;
//   fileName?: string;
//   originalName?: string;
//   contentType?: string;
//   size?: number;
//   uploadedAt?: string;
//   id?: string;
//   filename?: string;
//   mimetype?: string;
//   data?: string;
// }

// const safeName = (s: string) => s.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 100);

// export async function uploadDocument(caseId: string, slot: number, file: Express.Multer.File): Promise<DocumentMeta> {
//   const ext = ALLOWED_MIME[file.mimetype];
//   const fileName = `${Date.now()}-${randomUUID()}.${ext}`;
//   const path = `patient-cases/${caseId}/documents/${fileName}`;
//   // await bucket.file(path).save(file.buffer, {
//   //   resumable: false,
//   //   contentType: file.mimetype,
//   //   metadata: { cacheControl: "private, max-age=0", contentDisposition: `inline; filename="${safeName(file.originalname)}"` },
//   // });
  
//   const id = crypto.randomUUID();

//   return {
//     id,

//     filename: file.originalname,

//     mimetype: file.mimetype,

//     size: file.size,

//     // Actual file contents
//     data: file.buffer.toString("base64"),

//     // Logical identifier only.
//     // This is NOT Firebase Storage.
//     path: `cases/${caseId}/documents/${slot}/${id}`,
//   };

// }

// /** Never throws — orphaned objects are logged, not surfaced to users. */
// export async function deleteObject(path: string | undefined) {
//   if (!path || !path.startsWith("patient-cases/")) return;
//   try {
//     await bucket.file(path).delete({ ignoreNotFound: true });
//   } catch (e) {
//     console.warn("[storage] failed to delete", path, (e as Error).message);
//   }
// }

// export async function deleteCaseFolder(caseId: string) {
//   try {
//     await bucket.deleteFiles({ prefix: `patient-cases/${caseId}/` });
//   } catch (e) {
//     console.warn("[storage] failed to delete folder", caseId, (e as Error).message);
//   }
// }

// /** Short-lived signed URL; bucket stays private. */
// export async function signedUrl(path: string): Promise<string | null> {
//   try {
//     const [url] = await bucket.file(path).getSignedUrl({ action: "read", expires: Date.now() + 60 * 60 * 1000, version: "v4" });
//     return url;
//   } catch (e) {
//     console.warn("[storage] signed url failed", (e as Error).message);
//     return null;
//   }
// }

import { randomUUID } from "crypto";
import type { Express } from "express";
import { createClient } from "@supabase/supabase-js";
import { ALLOWED_MIME } from "../middleware/upload";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const SUPABASE_STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET ?? "case-documents";

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL is missing");
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is missing",
  );
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export interface DocumentMeta {
  slot?: number;
  path?: string;
  fileName?: string;
  originalName?: string;
  contentType?: string;
  size?: number;
  uploadedAt?: string;
  id?: string;

  // Existing field names kept for compatibility
  filename?: string;
  mimetype?: string;

  // IMPORTANT:
  // No Base64 data is stored anymore.
  data?: never;

  // Public URL if the bucket is public.
  // For a private bucket, this can be omitted and
  // signedUrl() should be used.
  url?: string;
}

const safeName = (s: string) =>
  s
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .slice(0, 100);

/**
 * Upload a document to Supabase Storage.
 *
 * The actual file is stored in:
 *
 * case-documents/
 *   patient-cases/
 *     {caseId}/
 *       documents/
 *         {filename}
 *
 * Firestore only stores the metadata/path.
 */
export async function uploadDocument(
  caseId: string,
  slot: number,
  file: Express.Multer.File,
): Promise<DocumentMeta> {
  const ext = ALLOWED_MIME[file.mimetype];

  if (!ext) {
    throw new Error(
      `Unsupported file type: ${file.mimetype}`,
    );
  }

  const id = randomUUID();

  const originalName = safeName(
    file.originalname,
  );

  const fileName =
    `${Date.now()}-${id}.${ext}`;

  const path =
    `patient-cases/${caseId}/documents/${fileName}`;

  const { error } = await supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error(
      "[storage] upload failed:",
      error.message,
    );

    throw new Error(
      `Failed to upload document: ${error.message}`,
    );
  }

  /*
   * If your bucket is PUBLIC, this gives you a
   * directly accessible URL.
   *
   * If your bucket is PRIVATE, don't rely on this URL.
   * Use signedUrl() below instead.
   */
  const { data: publicUrlData } =
    supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .getPublicUrl(path);

  return {
    id,

    slot,

    path,

    fileName,

    originalName,

    contentType: file.mimetype,

    size: file.size,

    uploadedAt: new Date().toISOString(),

    // Compatibility with your existing code
    filename: file.originalname,

    mimetype: file.mimetype,

    // IMPORTANT:
    // Do NOT store the actual file as Base64.
    //
    // data is intentionally omitted.
    //
    // data: file.buffer.toString("base64"),

    url: publicUrlData.publicUrl,
  };
}

/**
 * Delete one uploaded document.
 *
 * Never exposes the storage error to the user.
 */
export async function deleteObject(
  path: string | undefined,
) {
  if (!path) {
    return;
  }

  if (
    !path.startsWith("patient-cases/")
  ) {
    return;
  }

  try {
    const { error } =
      await supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .remove([path]);

    if (error) {
      console.warn(
        "[storage] failed to delete",
        path,
        error.message,
      );
    }
  } catch (e) {
    console.warn(
      "[storage] failed to delete",
      path,
      e instanceof Error
        ? e.message
        : String(e),
    );
  }
}

/**
 * Delete all documents belonging to a case.
 */
export async function deleteCaseFolder(
  caseId: string,
) {
  const prefix =
    `patient-cases/${caseId}/`;

  try {
    /*
     * Supabase Storage doesn't have the same
     * deleteFiles({ prefix }) API as Firebase.
     *
     * We first list the files recursively and
     * then delete them.
     */

    const filesToDelete: string[] = [];

    async function collectFiles(
      folder: string,
    ): Promise<void> {
      const { data, error } =
        await supabase.storage
          .from(SUPABASE_STORAGE_BUCKET)
          .list(folder, {
            limit: 100,
            offset: 0,
          });

      if (error) {
        throw error;
      }

      for (const item of data ?? []) {
        const itemPath = folder
          ? `${folder}/${item.name}`
          : item.name;

        /*
         * Supabase folders are virtual.
         *
         * A file has a metadata property such
         * as mimetype. A folder generally does not.
         */
        if (item.metadata) {
          filesToDelete.push(itemPath);
        } else {
          await collectFiles(itemPath);
        }
      }
    }

    await collectFiles(prefix);

    if (filesToDelete.length === 0) {
      return;
    }

    /*
     * Delete in chunks.
     */
    const chunkSize = 100;

    for (
      let i = 0;
      i < filesToDelete.length;
      i += chunkSize
    ) {
      const chunk = filesToDelete.slice(
        i,
        i + chunkSize,
      );

      const { error } =
        await supabase.storage
          .from(SUPABASE_STORAGE_BUCKET)
          .remove(chunk);

      if (error) {
        throw error;
      }
    }
  } catch (e) {
    console.warn(
      "[storage] failed to delete case folder",
      caseId,
      e instanceof Error
        ? e.message
        : String(e),
    );
  }
}

/**
 * Generate a short-lived signed URL.
 *
 * Use this if your Supabase bucket is PRIVATE.
 *
 * URL is valid for 1 hour.
 */
export async function signedUrl(
  path: string,
): Promise<string | null> {
  if (!path) {
    return null;
  }

  try {
    const { data, error } =
      await supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .createSignedUrl(
          path,
          60 * 60,
        );

    if (error) {
      console.warn(
        "[storage] signed url failed",
        error.message,
      );

      return null;
    }

    return data?.signedUrl ?? null;
  } catch (e) {
    console.warn(
      "[storage] signed url failed",
      e instanceof Error
        ? e.message
        : String(e),
    );

    return null;
  }
}
