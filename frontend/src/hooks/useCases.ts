import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { casesApi } from "@/lib/api";
import type { CaseFormValues } from "@/lib/schemas";

export const useCaseList = (limit: number, cursor: string | null, q: string) =>
  useQuery({
    queryKey: ["cases", { limit, cursor, q }],
    queryFn: () => casesApi.list({ limit, cursor, q }),
    placeholderData: keepPreviousData,
  });

export const useCase = (id: string) => useQuery({ queryKey: ["case", id], queryFn: () => casesApi.get(id) });

export function useSaveCase(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: CaseFormValues) => (id ? casesApi.update(id, v) : casesApi.create(v)),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ["cases"] });
      qc.setQueryData(["case", c.id], undefined);
      qc.invalidateQueries({ queryKey: ["case", c.id] });
    },
  });
}

export function useDeleteCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => casesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cases"] }),
  });
}
