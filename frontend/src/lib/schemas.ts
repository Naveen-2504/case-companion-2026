import { z } from "zod";

export const MAX_FILE_MB = Number(import.meta.env.VITE_MAX_FILE_SIZE_MB ?? 10);
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export const ACCEPT = ".jpg,.jpeg,.png,.webp,.pdf";

export const caseFormSchema = z.object({
  patientName: z.string().trim().min(2, "Enter the patient's name").max(120),
  age: z.union([z.coerce.number().int().min(0, "Invalid age").max(150, "Invalid age"), z.literal("").transform(() => null)]).nullable(),
  gender: z.enum(["male", "female", "other", "unspecified"]),
  phone: z.string().trim().max(30).regex(/^[0-9+()\-\s]*$/, "Only digits, spaces, + ( ) -"),
  address: z.string().trim().max(500),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a visit date"),
  chiefComplaint: z.string().max(50000),
  history: z.string().max(100000),
  prescription: z.string().max(50000),
  treatment: z.string().max(50000),
});
export type CaseFormValues = z.infer<typeof caseFormSchema>;

export function validateFile(f: File): string | null {
  if (!ALLOWED_TYPES.includes(f.type)) return "Only JPG, PNG, WEBP or PDF";
  if (f.size > MAX_FILE_MB * 1024 * 1024) return `Max ${MAX_FILE_MB} MB per file`;
  return null;
}
