export interface CaseDocument {
  slot: number;
  path: string;
  fileName: string;
  originalName: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  url: string | null;
}

export interface PatientCase {
  treatment: string;
  id: string;
  caseNumber: number;
  caseNumberDisplay: string;
  patientName: string;
  age: number | null;
  gender: "male" | "female" | "other" | "unspecified";
  phone: string;
  address: string;
  visitDate: string;
  chiefComplaint: string;
  history: string;
  prescription: string;
  documents: (CaseDocument | null)[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CasePage {
  items: PatientCase[];
  nextCursor: string | null;
}
