# Patient Case Management — build plan

## One important constraint to confirm first

This workspace runs one fixed app framework (TanStack Start + React + TypeScript + Vite). React Router cannot be used here — it is replaced by the built-in router, which does the same job (URLs, page navigation, print page). Everything else you asked for is possible as specified.

That leaves two ways forward:

**Option A (recommended, live preview works)**
- One app in this workspace: React + TypeScript + Vite + TanStack Router + Axios + React Hook Form + Zod + Tailwind + shadcn/ui + TanStack Query + rich text editor.
- Backend: Express + TypeScript + Firebase Admin SDK + Firestore + Storage + Multer, kept as a real Express REST API in `backend/`, deployable to Cloud Functions. Frontend talks to it over `VITE_API_BASE_URL`.
- You get a running, clickable app in preview plus a deployable backend.

**Option B (exact folder spec, no live preview)**
- `frontend/` uses React Router exactly as specified, `backend/` as above. Both are source-only deliverables; the workspace preview stays blank because the workspace cannot serve a React Router app.

The plan below assumes **Option A**. Say the word and I switch to B.

## What gets built

### Pages
- `/` redirects to `/cases`
- `/cases` — list: table on desktop, cards on mobile, debounced search (patient name, case number), page size 10/20/50, cursor pagination
- `/cases/add` — create form
- `/cases/:id` — detail view
- `/cases/:id/edit` — edit form
- `/cases/:id/print` — A4 print-only layout, images preloaded before `window.print()`

### Case record
- Patient details, four-digit case number (server-generated, never editable)
- Rich text: Chief Complaint, History, Prescription (sanitized HTML)
- Up to four optional files: JPG/JPEG/PNG/WEBP/PDF, 10MB each (configurable), upload progress, preview/replace/remove

### Backend (`backend/`)
- Express + TypeScript, routes: list (cursor paginated + search), get, create, update, delete, file upload/delete
- Firestore transaction on `counters/cases` for atomic unique case number 1..9999
- Storage path `patient-cases/{caseId}/documents/{uniqueFileName}`; Firestore stores metadata only
- Update/delete remove stale Storage objects, failures logged not fatal
- helmet, CORS allowlist, rate limiting, Zod validation, MIME + size + path checks, HTML sanitization, centralized error handler that never leaks stack traces or credentials
- Search layer behind a swappable interface so Algolia/Typesense can drop in later

### Config and docs
- `backend/.env.example`, `frontend/.env.example` (or root `.env.example` in Option A), `.gitignore`
- `README.md`: Firebase project setup, Firestore/Storage/Hosting enablement, required composite indexes, env variables, the security implications of an unauthenticated API, and deployment steps (Hosting for frontend, Cloud Functions for the Express API)

## What I will need from you later
1. Firebase project ID
2. Storage bucket name
3. A service account JSON (backend only — you add it as a secret, never in code)
4. Web app config values for the frontend, if we add client-side Firebase at all
5. Your allowed frontend origin(s) for CORS

Nothing is hardcoded; all of it is read from environment variables.

## Build order
1. Design system + shell + routing + redirect
2. Backend scaffolding: Express app, Firebase Admin init, error handling, security middleware
3. Case number transaction + CRUD endpoints
4. File upload endpoints with Multer + Storage
5. Frontend list, add, detail, edit with Query + Axios + forms
6. Print view
7. README, env examples, deployment config
