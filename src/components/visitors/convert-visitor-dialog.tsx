"use client";

import { History, Loader2, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/date-picker";
import { ApiError } from "@/lib/api-client";
import { convertVisitor } from "@/lib/api/visitors";
import { formatNumber } from "@/lib/format";
import type { Visitor } from "@/types/api";

interface ConvertVisitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitor: Visitor | null;
  onConverted: () => void;
}

interface ConvertFormState {
  baptismDate: string;
  birthDate: string;
  address: string;
  notes: string;
}

const EMPTY_FORM: ConvertFormState = {
  baptismDate: "",
  birthDate: "",
  address: "",
  notes: "",
};

function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

function successMessage(name: string, migrated: number): string {
  const who = `${firstName(name)} agora é membro.`;
  if (migrated === 0) return `${who} Nenhuma presença anterior precisou ser migrada.`;
  if (migrated === 1) return `${who} 1 presença foi preservada.`;
  return `${who} ${formatNumber(migrated)} presenças foram preservadas.`;
}

export function ConvertVisitorDialog({
  open,
  onOpenChange,
  visitor,
  onConverted,
}: ConvertVisitorDialogProps) {
  const [form, setForm] = useState<ConvertFormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY_FORM, notes: visitor?.notes ?? "" });
      setFieldErrors({});
    }
  }, [open, visitor]);

  function setField<K extends keyof ConvertFormState>(key: K, value: ConvertFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!visitor) return;

    setConverting(true);
    setFieldErrors({});
    try {
      const result = await convertVisitor(visitor.id, {
        baptismDate: orNull(form.baptismDate),
        birthDate: orNull(form.birthDate),
        address: orNull(form.address),
        notes: orNull(form.notes),
      });
      toast.success(successMessage(result.member.name, result.migratedAttendances));
      onOpenChange(false);
      onConverted();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
        // 409 means someone else already converted this visitor: the dialog has
        // nothing left to do, so close it and let the list show the new state.
        if (error.status === 409 || error.status === 404) {
          onOpenChange(false);
          onConverted();
        } else {
          setFieldErrors(error.fieldErrors);
        }
      } else {
        toast.error("Não foi possível converter o visitante.");
      }
    } finally {
      setConverting(false);
    }
  }

  const visitCount = visitor?.stats.visitCount ?? 0;

  return (
    <Dialog open={open} onOpenChange={converting ? undefined : onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Converter em membro</DialogTitle>
          <DialogDescription>
            {visitor
              ? `${visitor.name} passará a constar como membro da congregação.`
              : "Selecione um visitante."}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 flex gap-3 rounded-lg border p-3">
          <History className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div className="space-y-1 text-sm">
            <p className="font-medium">O histórico de presença é preservado</p>
            <p className="text-muted-foreground">
              {visitCount > 0
                ? `As ${formatNumber(visitCount)} ${visitCount === 1 ? "presença já registrada é transferida" : "presenças já registradas são transferidas"} para a ficha do novo membro — nada é apagado das chamadas anteriores.`
                : "Todas as presenças registradas como visitante são transferidas para a ficha do novo membro — nada é apagado das chamadas anteriores."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <p className="text-muted-foreground text-sm">
            Nome, telefone, e-mail e observações são copiados automaticamente. Os campos abaixo
            são opcionais e podem ser preenchidos depois.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="convert-baptism-date">Data de batismo</Label>
              <DatePicker
                id="convert-baptism-date"
                value={form.baptismDate || null}
                onChange={(value) => setField("baptismDate", value ?? "")}
                bounds="past"
                toYear={new Date().getFullYear()}
                placeholder="Selecione a data"
                aria-invalid={Boolean(fieldErrors.baptismDate)}
              />
              {fieldErrors.baptismDate ? (
                <p className="text-destructive text-xs">{fieldErrors.baptismDate}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="convert-birth-date">Data de nascimento</Label>
              <DatePicker
                id="convert-birth-date"
                value={form.birthDate || null}
                onChange={(value) => setField("birthDate", value ?? "")}
                bounds="past"
                toYear={new Date().getFullYear()}
                placeholder="Selecione a data"
                aria-invalid={Boolean(fieldErrors.birthDate)}
              />
              {fieldErrors.birthDate ? (
                <p className="text-destructive text-xs">{fieldErrors.birthDate}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="convert-address">Endereço</Label>
            <Input
              id="convert-address"
              value={form.address}
              onChange={(event) => setField("address", event.target.value)}
              placeholder="Rua, número, bairro"
              autoComplete="street-address"
              aria-invalid={Boolean(fieldErrors.address)}
            />
            {fieldErrors.address ? (
              <p className="text-destructive text-xs">{fieldErrors.address}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="convert-notes">Observações</Label>
            <Textarea
              id="convert-notes"
              value={form.notes}
              onChange={(event) => setField("notes", event.target.value)}
              placeholder="Observações que devem seguir na ficha do membro"
              rows={3}
            />
            {fieldErrors.notes ? (
              <p className="text-destructive text-xs">{fieldErrors.notes}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={converting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={converting || !visitor}>
              {converting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserCheck className="size-4" />
              )}
              Confirmar conversão
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
