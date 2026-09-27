import { useParams } from "react-router-dom";
import { CaseForm } from "@/components/CaseForm";
import { ErrorState } from "@/components/Layout";
import { Skeleton } from "@/components/ui";
import { useCase } from "@/hooks/useCases";
import { errorMessage } from "@/lib/api";

export function CaseAdd() {
  return <div className="space-y-4"><h1 className="text-2xl font-semibold">New case</h1><CaseForm /></div>;
}

export function CaseEdit() {
  const { id = "" } = useParams();
  const { data, isLoading, isError, error, refetch } = useCase(id);
  if (isLoading) return <Skeleton className="h-96" />;
  if (isError || !data) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;
  return <div className="space-y-4"><h1 className="text-2xl font-semibold">Edit case #{data.caseNumberDisplay}</h1><CaseForm key={data.updatedAt} existing={data} /></div>;
}
