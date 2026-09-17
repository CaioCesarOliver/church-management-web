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
import { createReferralSource, updateReferralSource } from "@/lib/api/domain";
import type { ReferralSource } from "@/types/api";

interface ReferralSourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` opens the dialog in "create" mode. */
  referralSource: ReferralSource | null;
  /** Suggested `sortOrder` for a new source: after the last one. */
  nextSortOrder: number;
  onSaved: () => void;
}

export function ReferralSourceFormDialog({
  open,
  onOpenChange,
  referralSource,
  nextSortOrder,
  onSaved,
}: ReferralSourceFormDialogProps) {
  const isEditing = referralSource !== null;
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open={open} onOpenChange={saving ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar origem" : "Nova origem de visitante"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize o nome, a ordem e a situação desta origem."
              : "Descreva como alguém pode ter conhecido a congregação."}
          </DialogDescription>
        </DialogHeader>

        {/* Keyed so switching rows while the dialog is open starts a fresh form,
            instead of resetting the fields from an effect. */}
        <ReferralSourceForm
          key={referralSource?.id ?? "new"}
          referralSource={referralSource}
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

interface ReferralSourceFormProps {
  referralSource: ReferralSource | null;
  nextSortOrder: number;
  saving: boolean;
  onSavingChange: (saving: boolean) => void;
  onCancel: () => void;
  onSaved: () => void;
}

function ReferralSourceForm({
  referralSource,
  nextSortOrder,
  saving,
  onSavingChange,
  onCancel,
  onSaved,
}: ReferralSourceFormProps) {
  const [name, setName] = useState(referralSource?.name ?? "");
  const [sortOrder, setSortOrder] = useState(
    String(referralSource?.sortOrder ?? nextSortOrder),
  );
  const [active, setActive] = useState(referralSource?.active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const parsedOrder = Number(sortOrder.trim());

    const found: Record<string, string> = {};
    if (trimmedName.length < 2) found.name = "Informe ao menos 2 caracteres.";
    if (!Number.isInteger(parsedOrder) || parsedOrder < 0) {
      found.sortOrder = "Informe um número inteiro maior ou igual a 0.";
    }

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onSavingChange(true);
    try {
      const payload = { name: trimmedName, sortOrder: parsedOrder, active };
      if (referralSource) {
        await updateReferralSource(referralSource.id, payload);
        toast.success("Origem atualizada.");
      } else {
        await createReferralSource(payload);
        toast.success("Origem criada.");
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
        toast.error("Não foi possível salvar a origem.");
      }
    } finally {
      onSavingChange(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="referral-source-name">Nome</Label>
        <Input
          id="referral-source-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Convite de um membro"
          disabled={saving}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "referral-source-name-error" : undefined}
        />
        {errors.name ? (
          <p id="referral-source-name-error" className="text-sm text-destructive">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="referral-source-order">Ordem</Label>
        <Input
          id="referral-source-order"
          type="number"
          inputMode="numeric"
          min={0}
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
          disabled={saving}
          className="sm:w-32"
          aria-invalid={Boolean(errors.sortOrder)}
        />
        <p className="text-xs text-muted-foreground">Define a posição na lista de seleção.</p>
        {errors.sortOrder ? <p className="text-sm text-destructive">{errors.sortOrder}</p> : null}
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="referral-source-active">Origem ativa</Label>
          <p className="text-xs text-muted-foreground">
            Uma origem inativa some dos formulários, mas os visitantes já registrados continuam
            atribuídos a ela.
          </p>
        </div>
        <Switch
          id="referral-source-active"
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
          {referralSource ? "Salvar alterações" : "Criar origem"}
        </Button>
      </DialogFooter>
    </form>
  );
}
