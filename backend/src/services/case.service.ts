import { db, FieldValue } from "../config/firebase";
import type { CaseInput } from "../schemas/case.schema";
import { AppError, notFound } from "../utils/AppError";
import { cleanHtml, cleanText } from "../utils/sanitize";
import { searchProvider } from "./search/searchProvider";
import { deleteCaseFolder, deleteObject, signedUrl, type DocumentMeta } from "./storage.service";

const cases = db.collection("cases");
const counterRef = db.collection("counters").doc("cases");
export const MAX_CASE_NUMBER = 9999;

function clean(input: CaseInput) {
  const patientName = cleanText(input.patientName);
  return {
    patientName,
    patientNameLower: patientName.toLowerCase(),
    age: input.age ?? null,
    gender: input.gender,
    phone: cleanText(input.phone),
    address: cleanText(input.address),
    visitDate: input.visitDate,
    chiefComplaint: cleanHtml(input.chiefComplaint),
    history: cleanHtml(input.history),
    prescription: cleanHtml(input.prescription),
  };
}

async function serialize(snap: FirebaseFirestore.DocumentSnapshot, withUrls = false) {
  const d = snap.data()!;
  const docs: (DocumentMeta | null)[] = d.documents ?? [null, null, null, null];
  const documents = await Promise.all(
    docs.map(async (m) => (m ? { ...m, url: withUrls ? await signedUrl(m.path) : null } : null)),
  );
  return {
    id: snap.id,
    ...d,
    caseNumberDisplay: String(d.caseNumber).padStart(4, "0"),
    documents,
    createdAt: d.createdAt?.toDate?.().toISOString() ?? null,
    updatedAt: d.updatedAt?.toDate?.().toISOString() ?? null,
  };
}

/** Atomic: reads counter, increments, creates case in one transaction. */
export async function createCase(input: CaseInput) {
  const ref = cases.doc();
  await db.runTransaction(async (tx) => {
    const counter = await tx.get(counterRef);
    const next = (counter.exists ? (counter.data()!.value as number) : 0) + 1;
    if (next > MAX_CASE_NUMBER) throw new AppError(409, "Case number limit (9999) reached", "CASE_LIMIT");
    tx.set(counterRef, { value: next, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    tx.create(ref, {
      ...clean(input),
      caseNumber: next,
      documents: [null, null, null, null],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  return serialize(await ref.get());
}

export async function listCases(opts: { limit: number; cursor?: string; q?: string }) {
  let query: FirebaseFirestore.Query = opts.q
    ? searchProvider.apply(cases, opts.q)
    : cases.orderBy("createdAt", "desc");
  if (opts.cursor) {
    const cur = await cases.doc(opts.cursor).get();
    if (cur.exists) query = query.startAfter(cur);
  }
  const snap = await query.limit(opts.limit + 1).get();
  const page = snap.docs.slice(0, opts.limit);
  const items = await Promise.all(page.map((d) => serialize(d)));
  return {
    items,
    nextCursor: snap.docs.length > opts.limit ? page[page.length - 1].id : null,
  };
}

export async function getCase(id: string) {
  const snap = await cases.doc(id).get();
  if (!snap.exists) throw notFound("Case");
  return serialize(snap, true);
}

export async function updateCase(id: string, input: CaseInput) {
  const ref = cases.doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw notFound("Case");
  // caseNumber, documents, createdAt are never overwritten here.
  await ref.update({ ...clean(input), updatedAt: FieldValue.serverTimestamp() });
  return serialize(await ref.get());
}

export async function deleteCase(id: string) {
  const ref = cases.doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw notFound("Case");
  await ref.delete();
  await deleteCaseFolder(id);
}

/** Sets a slot inside a transaction and returns the old path for cleanup. */
export async function setDocumentSlot(id: string, slot: number, meta: DocumentMeta | null) {
  const ref = cases.doc(id);
  const oldPath = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw notFound("Case");
    const docs: (DocumentMeta | null)[] = [...(snap.data()!.documents ?? [null, null, null, null])];
    while (docs.length < 4) docs.push(null);
    const prev = docs[slot]?.path;
    docs[slot] = meta;
    tx.update(ref, { documents: docs, updatedAt: FieldValue.serverTimestamp() });
    return prev;
  });
  if (oldPath && oldPath !== meta?.path) await deleteObject(oldPath);
  return getCase(id);
}

export async function caseExists(id: string) {
  return (await cases.doc(id).get()).exists;
}
