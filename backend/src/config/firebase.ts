import admin from "firebase-admin";
import { env } from "./env";

/**
 * Initializes the Admin SDK once.
 * - If FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL are set: explicit service-account credentials.
 * - Otherwise: Application Default Credentials (automatic on Cloud Functions / Cloud Run).
 */
function init() {
  if (admin.apps.length) return admin.app();
  const key = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const hasCert = key && !key.includes("REPLACE_ME") && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PROJECT_ID;
  return admin.initializeApp({
    credential: hasCert
      ? admin.credential.cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: key,
        })
      : admin.credential.applicationDefault(),
    projectId: env.FIREBASE_PROJECT_ID,
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
  });
}

const app = init();
export const db = app.firestore();
db.settings({ ignoreUndefinedProperties: true });
export const bucket = app.storage().bucket();
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;
