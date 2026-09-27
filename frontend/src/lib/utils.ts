import { clsx, type ClassValue } from "clsx";
import DOMPurify from "dompurify";
import { twMerge } from "tailwind-merge";

export const cn = (...i: ClassValue[]) => twMerge(clsx(i));
export const safeHtml = (html: string) => ({ __html: DOMPurify.sanitize(html ?? "") });
export const isHtmlEmpty = (html: string) => !html || html.replace(/<[^>]*>/g, "").trim() === "";
export const formatDate = (s?: string | null) =>
  s ? new Date(s.length === 10 ? s + "T00:00:00" : s).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—";
export const formatBytes = (n: number) => (n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);
