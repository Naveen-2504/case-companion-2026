import { z } from "zod";

export const caseInputSchema = z.object({
  patientName: z.string().trim().min(2).max(120),
  age: z.coerce.number().int().min(0).max(150).optional().nullable(),
  gender: z.enum(["male", "female", "other", "unspecified"]).default("unspecified"),
  phone: z.string().trim().max(30).regex(/^[0-9+()\-\s]*$/, "Invalid phone").optional().default(""),
  address: z.string().trim().max(500).optional().default(""),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  chiefComplaint: z.string().max(50_000).default(""),
  history: z.string().max(100_000).default(""),
  prescription: z.string().max(50_000).default(""),
  treatment: z.string().max(50_000).default(""),
}).strict();

export type CaseInput = z.infer<typeof caseInputSchema>;

export const listQuerySchema = z.object({
  limit: z.coerce.number().refine((n) => [10, 20, 50].includes(n), "limit must be 10, 20 or 50").default(10),
  cursor: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/).optional(),
  q: z.string().trim().max(80).optional(),
});

export const idSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, "Invalid id");
export const slotSchema = z.coerce.number().int().min(0).max(3);
