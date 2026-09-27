import { Eye, FileText, RefreshCw, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ACCEPT, MAX_FILE_MB, validateFile } from "@/lib/schemas";
import { formatBytes } from "@/lib/utils";
import type { CaseDocument } from "@/types";
import { Button, Tip } from "./ui";

export type SlotState =
  | { kind: "empty" }
  | { kind: "existing"; doc: CaseDocument }
  | { kind: "pending"; file: File; replaces?: CaseDocument }
  | { kind: "removed"; doc: CaseDocument };

export const initialSlots = (docs?: (CaseDocument | null)[]): SlotState[] =>
  [0, 1, 2, 3].map((i) => (docs?.[i] ? { kind: "existing", doc: docs[i]! } : { kind: "empty" }));

function Preview({ file, doc }: { file?: File; doc?: CaseDocument }) {
  const [url, setUrl] = useState<string | null>(doc?.url ?? null);
  useEffect(() => {
    if (!file) return;
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  const type = file?.type ?? doc?.contentType ?? "";
  if (type.startsWith("image/") && url) return <img src={url} alt="" className="h-full w-full object-cover" />;
  return <FileText className="size-10 text-muted-foreground" />;
}

export function DocumentSlots({ slots, onChange, progress }: { slots: SlotState[]; onChange: (s: SlotState[]) => void; progress: Record<number, number> }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const set = (i: number, s: SlotState) => onChange(slots.map((x, j) => (j === i ? s : x)));

  const pick = (i: number, f?: File) => {
    if (!f) return;
    const err = validateFile(f);
    if (err) return toast.error(err);
    const cur = slots[i];
    const replaces = cur.kind === "existing" ? cur.doc : cur.kind === "removed" ? cur.doc : cur.kind === "pending" ? cur.replaces : undefined;
    set(i, { kind: "pending", file: f, replaces });
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {slots.map((s, i) => {
          const name = s.kind === "pending" ? s.file.name : s.kind === "existing" ? s.doc.originalName : null;
          const size = s.kind === "pending" ? s.file.size : s.kind === "existing" ? s.doc.size : 0;
          const pct = progress[i];
          return (
            <div key={i} className="flex flex-col overflow-hidden rounded-lg border bg-card">
              <input ref={(el) => (inputs.current[i] = el)} type="file" accept={ACCEPT} className="hidden"
                onChange={(e) => { pick(i, e.target.files?.[0]); e.target.value = ""; }} />
              <div className="flex aspect-[4/3] items-center justify-center bg-muted">
                {s.kind === "pending" ? <Preview file={s.file} /> : s.kind === "existing" ? <Preview doc={s.doc} /> : (
                  <button type="button" onClick={() => inputs.current[i]?.click()}
                    className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:bg-accent">
                    <Upload className="size-5" /> Slot {i + 1}
                    {s.kind === "removed" && <span className="text-destructive">Will be removed</span>}
                  </button>
                )}
              </div>
              {name && (
                <div className="space-y-1 p-2">
                  <p className="truncate text-xs font-medium" title={name}>{name}</p>
                  <p className="text-[11px] text-muted-foreground">{formatBytes(size)}{s.kind === "pending" && " · not saved yet"}</p>
                  {pct !== undefined && (
                    <div className="h-1.5 overflow-hidden rounded bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
                  )}
                  <div className="flex gap-1">
                    {s.kind === "existing" && s.doc.url && (
                      <Tip label="Preview"><Button type="button" size="icon" variant="ghost" asChild>
                        <a href={s.doc.url} target="_blank" rel="noreferrer"><Eye /></a></Button></Tip>
                    )}
                    <Tip label="Replace"><Button type="button" size="icon" variant="ghost" onClick={() => inputs.current[i]?.click()}><RefreshCw /></Button></Tip>
                    <Tip label="Remove"><Button type="button" size="icon" variant="ghost" onClick={() =>
                      set(i, s.kind === "existing" ? { kind: "removed", doc: s.doc } : s.kind === "pending" && s.replaces ? { kind: "removed", doc: s.replaces } : { kind: "empty" })}>
                      <Trash2 /></Button></Tip>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Up to 4 files · JPG, PNG, WEBP or PDF · {MAX_FILE_MB} MB each</p>
    </div>
  );
}
