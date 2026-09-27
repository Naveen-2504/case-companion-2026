import { ArrowLeft, FileText, Pencil, Printer } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ErrorState } from "@/components/Layout";
import { Button, Card, Skeleton } from "@/components/ui";
import { useCase } from "@/hooks/useCases";
import { errorMessage } from "@/lib/api";
import { formatDate, isHtmlEmpty, safeHtml } from "@/lib/utils";

export default function CaseDetail() {
  const { id = "" } = useParams();
  const { data: c, isLoading, isError, error, refetch } = useCase(id);
  if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-40" /><Skeleton className="h-40" /></div>;
  if (isError || !c) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;
  const sections = [["Chief complaint", c.chiefComplaint], ["History", c.history], ["Prescription", c.prescription]] as const;
  return (
    <div className="space-y-4">
      <Link to="/cases" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> All cases</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-muted-foreground">Case #{c.caseNumberDisplay}</p>
          <h1 className="text-2xl font-semibold">{c.patientName}</h1>
          <p className="text-sm capitalize text-muted-foreground">{[c.age != null && `${c.age} yrs`, c.gender !== "unspecified" && c.gender, `Visit ${formatDate(c.visitDate)}`].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to={`/cases/${c.id}/print`}><Printer /> Print</Link></Button>
          <Button asChild><Link to={`/cases/${c.id}/edit`}><Pencil /> Edit</Link></Button>
        </div>
      </div>
      <Card className="grid gap-3 p-5 text-sm md:grid-cols-2">
        <div><span className="text-muted-foreground">Phone:</span> {c.phone || "—"}</div>
        <div><span className="text-muted-foreground">Address:</span> {c.address || "—"}</div>
      </Card>
      {sections.map(([t, h]) => (
        <Card key={t} className="p-5"><h2 className="mb-2 font-semibold">{t}</h2>
          {isHtmlEmpty(h) ? <p className="text-sm text-muted-foreground">Not recorded</p> : <div className="prose-clinical text-sm" dangerouslySetInnerHTML={safeHtml(h)} />}
        </Card>
      ))}
      <Card className="p-5"><h2 className="mb-3 font-semibold">Documents</h2>
        {c.documents.some(Boolean) ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {c.documents.filter(Boolean).map((d) => (
              <a key={d!.path} href={d!.url ?? "#"} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg border hover:ring-2 hover:ring-ring">
                <div className="flex aspect-[4/3] items-center justify-center bg-muted">
                  {d!.contentType.startsWith("image/") && d!.url ? <img src={d!.url} alt={d!.originalName} className="h-full w-full object-cover" /> : <FileText className="size-10 text-muted-foreground" />}
                </div>
                <p className="truncate p-2 text-xs">{d!.originalName}</p>
              </a>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground">No documents attached</p>}
      </Card>
    </div>
  );
}
