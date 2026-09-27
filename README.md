# Patient Case Management

Monorepo: `frontend/` (React + TS + Vite + React Router + TanStack Query + RHF/Zod + Tailwind + shadcn-style UI + TipTap) and `backend/` (Express + TS + Firebase Admin SDK + Firestore + Storage + Multer). Firebase project: `case-documentation-kb`.

## SECURITY FIRST: rotate the leaked key
A service-account private key was shared in chat. Treat it as compromised:
1. Google Cloud Console → IAM & Admin → Service Accounts → `firebase-adminsdk-fbsvc@case-documentation-kb.iam.gserviceaccount.com` → **Keys** → delete the existing key.
2. Only create a new key if you run the backend outside Google Cloud (see below). On Cloud Functions you need **no key at all**.

## Firebase console setup
1. Upgrade the project to the **Blaze** plan (required for Cloud Functions).
2. **Firestore**: Build → Firestore Database → Create (production mode). Deploy rules: `firebase deploy --only firestore`.
3. **Storage**: Build → Storage → Get started. Bucket: `case-documentation-kb.firebasestorage.app`. Deploy rules: `firebase deploy --only storage`.
4. **Signed URLs**: grant the functions runtime service account the role **Service Account Token Creator** on itself (IAM) so it can sign file URLs.
5. **Hosting**: Build → Hosting → Get started.

### Indexes
Queries use single-field indexes (created automatically): `createdAt desc`, `patientNameLower` range + order, `caseNumber ==`. No composite index is needed. If Firestore returns a "requires an index" link, click it and add the result to `firestore.indexes.json`.

## Environment variables
**frontend/.env** (copy `.env.example`): `VITE_API_URL=/api`, `VITE_MAX_FILE_SIZE_MB`, and the public `VITE_FIREBASE_*` values (already filled in except `VITE_FIREBASE_API_KEY` — copy it from Project settings → General → Your apps → Web app). These are public identifiers, not secrets.

**backend/.env** (copy `.env.example`): `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_STORAGE_BUCKET`, `CORS_ORIGINS`, `MAX_FILE_SIZE_MB`, `MAX_DOCUMENTS`, rate-limit values.

### Service-account key (local development only)
1. Service Accounts → the adminsdk account → Keys → **Add key → JSON**.
2. Copy `private_key` into `backend/.env` as `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`.
3. Delete the downloaded JSON. `.env` is gitignored.
4. For non-Google hosts (Render, Fly, etc.) set the same three variables in the host's secret manager.
5. **Never put the private key in the frontend, in `VITE_*` variables, in git, or in chat.**

On Cloud Functions, leave `FIREBASE_PRIVATE_KEY` unset — the Admin SDK uses Application Default Credentials automatically.

## Run locally
```
cd backend && npm i && npm run dev     # :8081
cd frontend && npm i && npm run dev    # :5173 (proxies /api)
```

## Deploy (the one manual step)
```
npm i -g firebase-tools && firebase login
cd frontend && npm i && npm run build && cd ..
cd backend && npm i && cd ..
firebase deploy   # hosting + functions + rules
```
Set `CORS_ORIGINS` for the function via `backend/.env` (Functions loads it on deploy) — do not add the private key there for Cloud Functions.

## How it works
- Case numbers: Firestore transaction on `counters/cases` increments and creates the case atomically; 1..9999, displayed as `0001`, never editable.
- Pagination: cursor-based (`startAfter` last doc id), 10/20/50.
- Search: indexed prefix query on `patientNameLower`, or exact `caseNumber` when digits — never scans the collection. Swap `backend/src/services/search/searchProvider.ts` for Algolia/Typesense later.
- Files: 4 slots, JPG/PNG/WEBP/PDF, 10 MB (configurable), magic-byte check, stored at `patient-cases/{caseId}/documents/{uniqueFileName}`; Firestore holds metadata only. Replace/remove/delete clean up old objects (failures logged, not fatal).
- Security: helmet, CORS allowlist, rate limiting, Zod validation, sanitize-html on rich text, centralized errors (no stacks), rules deny all direct client access.

## Unauthenticated access — implications
There is no login by design. **Anyone who knows the URL can read, edit and delete patient records.** This is not suitable for real patient data (HIPAA/GDPR). Before production: add Firebase Auth + token verification middleware, restrict Hosting access (IAP / VPN), or at minimum keep the URL private and enable Cloud Armor/App Check.
