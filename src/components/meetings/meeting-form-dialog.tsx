"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/date-picker";
import { useMeetingTypes } from "@/hooks/use-meeting-types";
import { ApiError } from "@/lib/api-client";
import { createMeeting, updateMeeting } from "@/lib/api/meetings";
import type { Meeting } from "@/types/api";

const DESCRIPTION_MAX_LENGTH = 500;

interface FormState {
  meetingTypeId: string;
  /** Full ISO datetime in UTC — exactly what the API stores. `""` when empty. */
  date: string;
  description: string;
}

function initialState(meeting: Meeting | null): FormState {
  if (meeting) {
    return {
      meetingTypeId: meeting.type.id,
      // `DateTimePicker` reads and writes the UTC instant itself, showing it in
      // local time, so the stored value travels through the form untouched.
      date: meeting.date,
      description: meeting.description ?? "",
    };
  }
  return {
    meetingTypeId: "",
    date: new Date().toISOString(),
    description: "",
  };
}

interface MeetingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` opens the dialog in "create" mode. */
  meeting: Meeting | null;
  onSaved: () => void;
}

/**
 * The parent remounts this with a fresh `key` every time the dialog is opened,
 * so the form seeds itself once here instead of resetting from an effect.
 */
export function MeetingFormDialog({
  open,
  onOpenChange,
  meeting,
  onSaved,
}: MeetingFormDialogProps) {
  const isEditing = meeting !== null;
  const { items: meetingTypes, loading: loadingTypes } = useMeetingTypes();
  const [form, setForm] = useState<FormState>(() => initialState(meeting));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const noTypes = !loadingTypes && meetingTypes.length === 0;

  // The list only arrives after the first paint, so a new meeting can be
  // pre-selected only once it is here.
  useEffect(() => {
    if (meetingTypes.length === 0) return;
    setForm((prev) =>
      prev.meetingTypeId === "" ? { ...prev, meetingTypeId: meetingTypes[0].id } : prev,
    );
  }, [meetingTypes]);

  function validate(): Record<string, string> {
    const found: Record<string, string> = {};

    if (!form.meetingTypeId) {
      found.meetingTypeId = "Escolha o tipo do culto.";
    }

    if (!form.date) {
      found.date = "Informe a data e a hora do culto.";
    } else if (Number.isNaN(new Date(form.date).getTime())) {
      found.date = "Data inválida.";
    }

    if (form.description.length > DESCRIPTION_MAX_LENGTH) {
      found.description = `A descrição deve ter no máximo ${DESCRIPTION_MAX_LENGTH} caracteres.`;
    }

    return found;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const description = form.description.trim();
    const payload = {
      meetingTypeId: form.meetingTypeId,
      date: form.date,
      description: description === "" ? null : description,
    };

    setSubmitting(true);
    try {
      if (meeting) {
        await updateMeeting(meeting.id, payload);
        toast.success("Culto atualizado.");
      } else {
        await createMeeting(payload);
        toast.success("Culto registrado.");
      }
      onOpenChange(false);
      onSaved();
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldErrors = error.fieldErrors;
        setErrors(fieldErrors);
        // A field-level message is already shown next to the input; only the
        // non-field failures need the toast to be heard.
        if (Object.keys(fieldErrors).length === 0) toast.error(error.message);
      } else {
        toast.error("Não foi possível salvar o culto.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={submitting ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar culto" : "Novo culto"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Atualize os dados deste culto."
                : "Registre o culto para poder fazer a chamada."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="meeting-form-type">Tipo</Label>

              {loadingTypes ? (
                <Skeleton className="h-9 w-full" />
              ) : noTypes ? (
                <div className="space-y-2 rounded-md border border-dashed p-3">
                  <p className="text-sm text-muted-foreground">
                    Esta congregação ainda não tem tipos de culto cadastrados. Cadastre ao menos um
                    para poder registrar cultos.
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/settings">Ir para Configurações</Link>
                  </Button>
                </div>
              ) : (
                <Select
                  value={form.meetingTypeId}
                  onValueChange={(meetingTypeId) => setForm((prev) => ({ ...prev, meetingTypeId }))}
                >
                  <SelectTrigger
                    id="meeting-form-type"
                    className="w-full"
                    aria-invalid={Boolean(errors.meetingTypeId)}
                  >
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {meetingTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <span className="flex items-center gap-2">
                          {/* Congregation data, not chrome — applied inline on purpose. */}
                          <span
                            aria-hidden="true"
                            className="size-2 shrink-0 rounded-full"
                            style={{ backgroundColor: type.color ?? "var(--chart-1)" }}
                          />
                          {type.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {errors.meetingTypeId ? (
                <p className="text-destructive text-sm">{errors.meetingTypeId}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="meeting-form-date">Data e hora</Label>
              <DateTimePicker
                id="meeting-form-date"
                value={form.date || null}
                aria-invalid={Boolean(errors.date)}
                onChange={(date) => setForm((prev) => ({ ...prev, date: date ?? "" }))}
              />
              {errors.date ? <p className="text-destructive text-sm">{errors.date}</p> : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="meeting-form-description">Descrição</Label>
              <Textarea
                id="meeting-form-description"
                value={form.description}
                maxLength={DESCRIPTION_MAX_LENGTH}
                rows={3}
                placeholder="Opcional — ex.: Culto de celebração com Santa Ceia"
                aria-invalid={Boolean(errors.description)}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, description: event.target.value }))
                }
              />
              <div className="flex items-start justify-between gap-2">
                <p className="text-destructive text-sm">{errors.description ?? ""}</p>
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                  {form.description.length}/{DESCRIPTION_MAX_LENGTH}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || loadingTypes || noTypes}>
              {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {isEditing ? "Salvar alterações" : "Registrar culto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
