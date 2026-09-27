import { onRequest } from "firebase-functions/v2/https";
import { createApp } from "./app";

// Exposed via Hosting rewrite "/api/**" -> function "api".
// On Cloud Functions, Admin SDK uses Application Default Credentials automatically.
export const api = onRequest({ region: "us-central1", memory: "512MiB", timeoutSeconds: 120 }, createApp());
