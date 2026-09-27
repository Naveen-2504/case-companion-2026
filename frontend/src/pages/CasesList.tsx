import { Eye, Pencil, Printer, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ErrorState } from "@/components/Layout";
import { Button, Card, ConfirmDialog, Input, Select, Skeleton, Tip } from "@/components/ui";
import { useCaseList, useDeleteCase } from "@/hooks/useCases";
import { useDebounce } from "@/hooks/useDebounce";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { PatientCase } from "@/types";

export default function CasesList() {
  const [q, setQ] = useState("");
  const dq = useDebounce(q);
  const [limit, setLimit] = useState(10);
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const page = cursors.length - 1;
  useEffect(() => setCursors([null]), [dq, limit]);
  const { data, isLoading, isError, error, refetch, isFetching } = useCaseList(limit, cursors[page], dq);
  const del = useDeleteCase();
  const [target, setTarget] = useState<PatientCase | null>(null);

  const Actions = ({ c }: { c: PatientCase }) => (
    <div className="flex justify-end gap-1">
      <Tip label="View"><Button asChild size="icon" variant="ghost"><Link to={`/cases/${c.id}`}><Eye /></Link></Button></Tip>
      <Tip label="Edit"><Button asChild size="icon" variant="ghost"><Link to={`/cases/${c.id}/edit`}><Pencil /></Link></Button></Tip>
      <Tip label="Print"><Button asChild size="icon" variant="ghost"><Link to={`/cases/${c.id}/print`}><Printer /></Link></Button></Tip>
      <Tip label="Delete"><Button size="icon" variant="ghost" onClick={() => setTarget(c)}><Trash2 className="text-destructive" /></Button></Tip>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div><h1 className="text-2xl font-semibold">Cases</h1><p className="text-sm text-muted-foreground">Search by patient name or case number</p></div>
        <div className="relative md:w-80">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="e.g. Priya or 0042" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search cases" />
        </div>
      </div>

      {isError ? <ErrorState message={errorMessage(error)} onRetry={() => refetch()} /> : isLoading ? (
        <Card className="space-y-3 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</Card>
      ) : !data?.items.length ? (
        <Card className="p-12 text-center">
          <p className="font-medium">{dq ? "No matching cases" : "No cases yet"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{dq ? "Try a different name or number." : "Create the first patient case."}</p>
          {!dq && <Button asChild className="mt-4"><Link to="/cases/add">New case</Link></Button>}
        </Card>
      ) : (
        <>
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-4 py-3">Case #</th><th className="px-4 py-3">Patient</th><th className="px-4 py-3">Age / Gender</th><th className="px-4 py-3">Visit</th><th className="px-4 py-3">Files</th><th /></tr>
              </thead>
              <tbody className={isFetching ? "opacity-60" : ""}>
                {data.items.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-muted/40">
                    <td className="px-4 py-2 font-mono">{c.caseNumberDisplay}</td>
                    <td className="px-4 py-2 font-medium"><Link to={`/cases/${c.id}`} className="hover:underline">{c.patientName}</Link></td>
                    <td className="px-4 py-2 capitalize text-muted-foreground">{c.age ?? "—"} / {c.gender === "unspecified" ? "—" : c.gender}</td>
                    <td className="px-4 py-2">{formatDate(c.visitDate)}</td>
                    <td className="px-4 py-2">{c.documents.filter(Boolean).length}</td>
                    <td className="px-4 py-2"><Actions c={c} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <div className="grid gap-3 md:hidden">
            {data.items.map((c) => (
              <Card key={c.id} className="p-4">
                <div className="flex justify-between"><span className="font-mono text-sm text-muted-foreground">#{c.caseNumberDisplay}</span><span className="text-sm">{formatDate(c.visitDate)}</span></div>
                <Link to={`/cases/${c.id}`} className="mt-1 block font-medium">{c.patientName}</Link>
                <Actions c={c} />
              </Card>
            ))}
          </div>
        </>
      )}

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">Rows
          <Select className="h-8 w-20" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            {[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Page {page + 1}</span>
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setCursors((c) => c.slice(0, -1))}>Previous</Button>
          <Button variant="outline" size="sm" disabled={!data?.nextCursor} onClick={() => setCursors((c) => [...c, data!.nextCursor])}>Next</Button>
        </div>
      </div>

      <ConfirmDialog open={!!target} onOpenChange={(o) => !o && setTarget(null)} loading={del.isPending}
        title={`Delete case #${target?.caseNumberDisplay}?`}
        description="This permanently deletes the record and all its documents. This cannot be undone."
        onConfirm={() => target && del.mutate(target.id, {
          onSuccess: () => { toast.success("Case deleted"); setTarget(null); },
          onError: (e) => toast.error(errorMessage(e)),
        })} />
    </div>
  );
}
