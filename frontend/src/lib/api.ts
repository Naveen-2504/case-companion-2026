import axios, { AxiosError } from "axios";
import type { CaseFormValues } from "./schemas";
import type { CasePage, PatientCase } from "@/types";

export const http = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api", timeout: 60_000 });

export function errorMessage(e: unknown): string {
  const ax = e as AxiosError<{ error?: { message?: string } }>;
  if (ax?.response?.data?.error?.message) return ax.response.data.error.message;
  if (ax?.code === "ERR_NETWORK") return "Cannot reach the server. Check your connection.";
  return "Something went wrong";
}

export const casesApi = {
  list: (p: { limit: number; cursor?: string | null; q?: string }) =>
    http.get<CasePage>("/cases", { params: { limit: p.limit, cursor: p.cursor || undefined, q: p.q || undefined } }).then((r) => r.data),
  get: (id: string) => http.get<PatientCase>(`/cases/${id}`).then((r) => r.data),
  create: (v: CaseFormValues) => http.post<PatientCase>("/cases", v).then((r) => r.data),
  update: (id: string, v: CaseFormValues) => http.put<PatientCase>(`/cases/${id}`, v).then((r) => r.data),
  remove: (id: string) => http.delete(`/cases/${id}`),
  uploadDoc: (id: string, slot: number, file: File, onProgress?: (pct: number) => void) => {
    const fd = new FormData();
    fd.append("file", file);
    return http
      .post<PatientCase>(`/cases/${id}/documents/${slot}`, fd, {
        onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
      })
      .then((r) => r.data);
  },
  removeDoc: (id: string, slot: number) => http.delete<PatientCase>(`/cases/${id}/documents/${slot}`).then((r) => r.data),
};
