import type { Query } from "firebase-admin/firestore";

/**
 * Search abstraction. Firestore implementation uses indexed prefix queries
 * (never downloads the collection). Swap for Algolia/Typesense by implementing
 * `SearchProvider` and returning matching IDs, then load those docs.
 */
export interface SearchProvider {
  apply(base: Query, q: string): Query;
}

export const firestoreSearch: SearchProvider = {
  apply(base, raw) {
    const q = raw.trim();
    const digits = q.replace(/^#/, "");
    if (/^\d{1,4}$/.test(digits)) {
      return base.where("caseNumber", "==", Number(digits));
    }
    const lower = q.toLowerCase();
    return base
      .where("patientNameLower", ">=", lower)
      .where("patientNameLower", "<", lower + "\uf8ff")
      .orderBy("patientNameLower");
  },
};

export const searchProvider: SearchProvider = firestoreSearch;
