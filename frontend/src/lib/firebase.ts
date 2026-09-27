import { getApps, initializeApp, type FirebaseOptions } from "firebase/app";

/**
 * Client Firebase config — public identifiers only. All data access goes
 * through the Express API (Admin SDK), so no Firestore/Storage client calls
 * are made from the browser. Analytics is loaded lazily if supported.
 */
const config: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export function initFirebase() {
  if (!config.apiKey || String(config.apiKey).startsWith("REPLACE")) return null;
  const app = getApps()[0] ?? initializeApp(config);
  if (config.measurementId) {
    import("firebase/analytics").then(async ({ getAnalytics, isSupported }) => {
      if (await isSupported()) getAnalytics(app);
    });
  }
  return app;
}
