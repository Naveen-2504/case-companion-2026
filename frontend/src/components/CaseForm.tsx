import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useSaveCase } from "@/hooks/useCases";
import { casesApi, errorMessage } from "@/lib/api";
import { caseFormSchema, type CaseFormValues } from "@/lib/schemas";
import type { PatientCase } from "@/types";
import { DocumentSlots, initialSlots, type SlotState } from "./DocumentSlots";
import { RichTextEditor } from "./RichTextEditor";
import { Button, Card, Input, Label, Select } from "./ui";

const today = () => new Date().toISOString().slice(0, 10);

function Field({ label, error, children, htmlFor }: { label: string; error?: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function CaseForm({ existing }: { existing?: PatientCase }) {
  const nav = useNavigate();
  const qc = useQueryClient();
  const save = useSaveCase(existing?.id);
  const [slots, setSlots] = useState<SlotState[]>(initialSlots(existing?.documents));
  const [progress, setProgress] = useState<Record<number, number>>({});
  const [busy, setBusy] = useState(false);

  const { register, control, handleSubmit, formState: { errors, isDirty } } = useForm<CaseFormValues>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
      patientName: existing?.patientName ?? "",
      age: existing?.age ?? null,
      gender: existing?.gender ?? "unspecified",
      phone: existing?.phone ?? "",
      address: existing?.address ?? "",
      visitDate: existing?.visitDate ?? today(),
      chiefComplaint: existing?.chiefComplaint ?? "",
      history: existing?.history ?? "",
      prescription: existing?.prescription ?? "",
      treatment: existing?.treatment ?? "",
    },
  });

  const onSubmit = async (values: CaseFormValues) => {
    setBusy(true);
    try {
      const saved = await save.mutateAsync(values);
      let failed = 0;
      for (let i = 0; i < 4; i++) {
        const s = slots[i];
        try {
          if (s.kind === "pending") {
            setProgress((p) => ({ ...p, [i]: 0 }));
            await casesApi.uploadDoc(saved.id, i, s.file, (pct) => setProgress((p) => ({ ...p, [i]: pct })));
          } else if (s.kind === "removed") {
            await casesApi.removeDoc(saved.id, i);
          }
        } catch (e) {
          failed++;
          toast.error(`File ${i + 1}: ${errorMessage(e)}`);
        }
      }
      qc.invalidateQueries({ queryKey: ["case", saved.id] });
      qc.invalidateQueries({ queryKey: ["cases"] });
      toast.success(existing ? "Case updated" : `Case #${saved.caseNumberDisplay} created`, failed ? { description: `${failed} file(s) failed to upload` } : undefined);
      nav(`/cases/${saved.id}`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
      setProgress({});
    }
  };

  const richFields: { name: "chiefComplaint" | "treatment" | "history" | "prescription"; label: string }[] = [
    { name: "chiefComplaint", label: "Chief complaint" },
    { name: "history", label: "History" },
    { name: "treatment", label: "Treatment" },
    { name: "prescription", label: "Prescription" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Patient</h2>
          <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground" title="Assigned automatically, cannot be edited">
            Case # {existing ? existing.caseNumberDisplay : "auto"}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Patient name *" error={errors.patientName?.message} htmlFor="patientName">
            <Input id="patientName" autoFocus {...register("patientName")} />
          </Field>
          <Field label="Visit date *" error={errors.visitDate?.message} htmlFor="visitDate">
            <Input id="visitDate" type="date" {...register("visitDate")} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Age" error={errors.age?.message} htmlFor="age">
              <Input id="age" type="number" min={0} max={150} {...register("age")} />
            </Field>
            <Field label="Gender" htmlFor="gender">
              <Select id="gender" {...register("gender")}>
                <option value="unspecified">—</option><option value="female">Female</option>
                <option value="male">Male</option><option value="other">Other</option>
              </Select>
            </Field>
          </div>
          <Field label="Phone" error={errors.phone?.message} htmlFor="phone">
            <Input id="phone" type="tel" {...register("phone")} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Address" error={errors.address?.message} htmlFor="address"><Input id="address" {...register("address")} /></Field>
          </div>
        </div>
      </Card>

      {richFields.map((f) => (
        <Card key={f.name} className="p-5">
          <Field label={f.label} error={errors[f.name]?.message}>
            <Controller control={control} name={f.name} render={({ field }) => (
              <RichTextEditor value={field.value} onChange={field.onChange} placeholder={`Enter ${f.label.toLowerCase()}…`} />
            )} />
          </Field>
        </Card>
      ))}

      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Documents</h2>
        <DocumentSlots slots={slots} onChange={setSlots} progress={progress} />
      </Card>

      <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur">
        <Button type="button" variant="outline" onClick={() => {
          if ((isDirty || slots.some((s) => s.kind === "pending" || s.kind === "removed")) && !confirm("Discard unsaved changes?")) return;
          nav(existing ? `/cases/${existing.id}` : "/cases");
        }}>Cancel</Button>
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : existing ? "Save changes" : "Create case"}</Button>
      </div>
    </form>
  );
}
