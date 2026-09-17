"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api-client";
import { createMeetingType, updateMeetingType } from "@/lib/api/domain";
import type { MeetingType } from "@/types/api";

/** Used when a type has no colour yet, so `<input type="color">` has a value. */
const FALLBACK_COLOR = "#4f46e5";
const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

interface MeetingTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` opens the dialog in "create" mode. */
  meetingType: MeetingType | null;
  /** Suggested `sortOrder` for a new type: after the last one. */
  nextSortOrder: number;
  onSaved: () => void;
}

export function MeetingTypeFormDialog({
  open,
  onOpenChange,
  meetingType,
  nextSortOrder,
  onSaved,
}: MeetingTypeFormDialogProps) {
  const isEditing = meetingType !== null;
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open={open} onOpenChange={saving ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar tipo de culto" : "Novo tipo de culto"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize o nome, a cor e a ordem deste tipo de culto."
              : "Dê um nome ao tipo de encontro como a congregação o chama."}
          </DialogDescription>
        </DialogHeader>

        {/* Keyed so switching rows while the dialog is open starts a fresh form,
            instead of resetting the fields from an effect. */}
        <MeetingTypeForm
          key={meetingType?.id ?? "new"}
          meetingType={meetingType}
          nextSortOrder={nextSortOrder}
          saving={saving}
          onSavingChange={setSaving}
          onCancel={() => onOpenChange(false)}
          onSaved={() => {
            onOpenChange(false);
            onSaved();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

interface MeetingTypeFormProps {
  meetingType: MeetingType | null;
  nextSortOrder: number;
  saving: boolean;
  onSavingChange: (saving: boolean) => void;
  onCancel: () => void;
  onSaved: () => void;
}

function MeetingTypeForm({
  meetingType,
  nextSortOrder,
  saving,
  onSavingChange,
  onCancel,
  onSaved,
}: MeetingTypeFormProps) {
  const [name, setName] = useState(meetingType?.name ?? "");
  const [color, setColor] = useState(meetingType?.color ?? FALLBACK_COLOR);
  const [active, setActive] = useState(meetingType?.active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    const found: Record<string, string> = {};
    if (trimmedName.length < 2) found.name = "Informe ao menos 2 caracteres.";
    if (!HEX_PATTERN.test(color)) found.color = "Use uma cor no formato #RRGGBB.";

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onSavingChange(true);
    try {
      // Order is not a form field: a new type is appended at the end and the
      // list is rearranged by dragging. Editing deliberately omits `sortOrder`
      // so saving a rename never silently moves the row.
      const payload = meetingType
        ? { name: trimmedName, color, active }
        : { name: trimmedName, color, active, sortOrder: nextSortOrder };
      if (meetingType) {
        await updateMeetingType(meetingType.id, payload);
        toast.success("Tipo de culto atualizado.");
      } else {
        await createMeetingType(payload);
        toast.success("Tipo de culto criado.");
      }
      onSaved();
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldErrors = error.fieldErrors;
        // A duplicate name comes back as a 409 with no per-field detail.
        setErrors(
          error.status === 409 && Object.keys(fieldErrors).length === 0
            ? { name: error.message }
            : fieldErrors,
        );
        toast.error(error.message);
      } else {
        toast.error("Não foi possível salvar o tipo de culto.");
      }
    } finally {
      onSavingChange(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="meeting-type-name">Nome</Label>
        <Input
          id="meeting-type-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Culto de celebração"
          disabled={saving}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "meeting-type-name-error" : undefined}
        />
        {errors.name ? (
          <p id="meeting-type-name-error" className="text-sm text-destructive">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="meeting-type-color">Cor</Label>
          <div className="flex items-center gap-2">
            <Input
              id="meeting-type-color"
              type="color"
              value={HEX_PATTERN.test(color) ? color : FALLBACK_COLOR}
              onChange={(event) => setColor(event.target.value)}
              disabled={saving}
              className="h-9 w-14 shrink-0 p-1"
            />
            <Input
              value={color}
              onChange={(event) => setColor(event.target.value)}
              disabled={saving}
              spellCheck={false}
              autoCapitalize="none"
              aria-label="Cor em hexadecimal"
              placeholder="#4F46E5"
              className="font-mono"
              aria-invalid={Boolean(errors.color)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Usada nos gráficos e nas etiquetas da lista de cultos.
          </p>
          {errors.color ? <p className="text-sm text-destructive">{errors.color}</p> : null}
        </div>

      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="meeting-type-active">Tipo ativo</Label>
          <p className="text-xs text-muted-foreground">
            Um tipo inativo some dos formulários, mas os cultos já registrados continuam
            aparecendo com ele.
          </p>
        </div>
        <Switch
          id="meeting-type-active"
          checked={active}
          onCheckedChange={setActive}
          disabled={saving}
        />
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={saving}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          {meetingType ? "Salvar alterações" : "Criar tipo"}
        </Button>
      </DialogFooter>
    </form>
  );
}
