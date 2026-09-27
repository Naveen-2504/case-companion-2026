import { ArrowLeft, Printer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ErrorState } from "@/components/Layout";
import { Button, Skeleton } from "@/components/ui";
import { useCase } from "@/hooks/useCases";
import { errorMessage } from "@/lib/api";
import { formatDate, isHtmlEmpty, safeHtml } from "@/lib/utils";

export default function CasePrint() {
  const { id = "" } = useParams();
  const { data: c, isLoading, isError, error } = useCase(id);
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const printed = useRef(false);

  useEffect(() => {
    if (!c || !ref.current) return;
    const imgs = Array.from(ref.current.querySelectorAll("img"));
    Promise.all(imgs.map((img) => (img.complete ? Promise.resolve() : new Promise<void>((r) => { img.onload = img.onerror = () => r(); }))))
      .then(() => {
        setReady(true);
        if (!printed.current) { printed.current = true; setTimeout(() => window.print(), 200); }
      });
  }, [c]);

  if (isLoading) return <Skeleton className="mx-auto h-[80vh] max-w-[210mm]" />;
  if (isError || !c) return <ErrorState message={errorMessage(error)} />;
  const images = c.documents.filter((d) => d && d.contentType.startsWith("image/") && d.url);
  const pdfs = c.documents.filter((d) => d && d.contentType === "application/pdf");

  return (
    <div>
      <div className="no-print mb-4 flex justify-between">
        <Button asChild variant="ghost"><Link to={`/cases/${c.id}`}><ArrowLeft /> Back</Link></Button>
        <Button onClick={() => window.print()} disabled={!ready}><Printer /> {ready ? "Print" : "Loading images…"}</Button>
      </div>
      <div ref={ref} className="print-sheet mx-auto max-w-[210mm] rounded-lg border bg-card p-10 text-sm shadow-sm">
        <header className="flex items-end justify-between border-b-2 border-foreground pb-3">
          <div><h1 className="text-xl font-semibold">Patient Case Record</h1><p className="text-muted-foreground">Visit {formatDate(c.visitDate)}</p></div>
          <p className="font-mono text-lg">#{c.caseNumberDisplay}</p>
        </header>
        <table className="mt-4 w-full">
          <tbody>
            <tr><td className="w-28 py-1 text-muted-foreground">Name</td><td className="font-medium">{c.patientName}</td><td className="w-20 text-muted-foreground">Age</td><td>{c.age ?? "—"}</td></tr>
            <tr><td className="py-1 text-muted-foreground">Gender</td><td className="capitalize">{c.gender === "unspecified" ? "—" : c.gender}</td><td className="text-muted-foreground">Phone</td><td>{c.phone || "—"}</td></tr>
            <tr><td className="py-1 text-muted-foreground">Address</td><td colSpan={3}>{c.address || "—"}</td></tr>
          </tbody>
        </table>
        {([["Chief complaint", c.chiefComplaint], ["History", c.history], ["Prescription", c.prescription]] as const).map(([t, h]) => (
          <section key={t} className="print-avoid-break mt-5">
            <h2 className="mb-1 border-b pb-1 font-semibold uppercase tracking-wide text-xs">{t}</h2>
            {isHtmlEmpty(h) ? <p className="text-muted-foreground">—</p> : <div className="prose-clinical" dangerouslySetInnerHTML={safeHtml(h)} />}
          </section>
        ))}
        {images.length > 0 && (
          <section className="mt-5"><h2 className="mb-2 border-b pb-1 text-xs font-semibold uppercase tracking-wide">Attachments</h2>
            <div className="grid grid-cols-2 gap-3">{images.map((d) => <img key={d!.path} src={d!.url!} alt={d!.originalName} className="print-avoid-break max-h-[110mm] w-full rounded border object-contain" />)}</div>
          </section>
        )}
        {pdfs.length > 0 && <p className="mt-3 text-xs text-muted-foreground">PDF attachments (not printed): {pdfs.map((d) => d!.originalName).join(", ")}</p>}
      </div>
    </div>
  );
}
