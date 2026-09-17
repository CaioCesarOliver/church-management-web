"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  CongregationFormFields,
  validateCongregationValues,
  type CongregationFormValues,
} from "@/components/settings/congregation-form-fields";
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
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api-client";
import { createCongregation, switchCongregation, updateCongregation } from "@/lib/api/settings";
import type { Congregation } from "@/types/api";

interface CongregationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present for edit, absent for create. */
  congregation?: Congregation | null;
  onSaved: () => void;
}

export function CongregationFormDialog({
  open,
  onOpenChange,
  congregation,
  onSaved,
}: CongregationFormDialogProps) {
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(congregation);

  return (
    <Dialog open={open} onOpenChange={saving ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar congregação" : "Nova congregação"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize o nome, o slug e a situação desta congregação."
              : "Cadastre uma nova congregação. Ela começa vazia, com seus próprios membros, cultos e usuários."}
          </DialogDescription>
        </DialogHeader>
        {/* Keyed so switching rows while the dialog is open starts a fresh form,
            instead of resetting the fields from an effect. */}
        <CongregationForm
          key={congregation?.id ?? "new"}
          congregation={congregation ?? null}
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

interface CongregationFormProps {
  congregation: Congregation | null;
  saving: boolean;
  onSavingChange: (saving: boolean) => void;
  onCancel: () => void;
  onSaved: () => void;
}

function CongregationForm({
  congregation,
  saving,
  onSavingChange,
  onCancel,
  onSaved,
}: CongregationFormProps) {
  const isEdit = congregation !== null;
  const [values, setValues] = useState<CongregationFormValues>({
    name: congregation?.name ?? "",
    slug: congregation?.slug ?? "",
  });
  const [active, setActive] = useState(congregation?.active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const found = validateCongregationValues(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const name = values.name.trim();
    const slug = values.slug.trim();

    onSavingChange(true);
    try {
      if (congregation) {
        await updateCongregation(congregation.id, { name, slug, active });
        toast.success("Congregação atualizada.");
      } else {
        const created = await createCongregation({ name, slug });
        // Creating a congregation does NOT switch into it: the caller is still
        // acting inside whichever congregation they were in, so the Usuários and
        // Membros tabs keep showing that one. Offering the switch right here is
        // what closes the gap between "criei" and "estou dentro dela".
        toast.success(`Congregação "${created.name}" criada.`, {
          description: "Ela já vem com os tipos de culto e as origens de visitante padrão.",
          action: {
            label: "Acessar agora",
            onClick: () => {
              void switchCongregation(created.id).then(() => window.location.replace("/settings"));
            },
          },
          duration: 10_000,
        });
      }
      onSaved();
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldErrors = error.fieldErrors;
        // A taken slug comes back as a 409 with no per-field detail.
        setErrors(
          error.status === 409 && Object.keys(fieldErrors).length === 0
            ? { slug: error.message }
            : fieldErrors,
        );
        toast.error(error.message);
      } else {
        toast.error("Não foi possível salvar a congregação.");
      }
    } finally {
      onSavingChange(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <CongregationFormFields
        idPrefix={isEdit ? "edit-congregation" : "new-congregation"}
        values={values}
        onChange={setValues}
        errors={errors}
        disabled={saving}
        // An existing slug is already in addresses people use: never move it on
        // its own just because the name was corrected.
        deriveSlug={!isEdit}
      />

      {isEdit ? (
        <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label htmlFor="edit-congregation-active">Congregação ativa</Label>
            <p className="text-xs text-muted-foreground">
              Uma congregação inativa fica indisponível para acesso e troca.
            </p>
          </div>
          <Switch
            id="edit-congregation-active"
            checked={active}
            onCheckedChange={setActive}
            disabled={saving}
          />
        </div>
      ) : null}

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
          {isEdit ? "Salvar alterações" : "Criar congregação"}
        </Button>
      </DialogFooter>
    </form>
  );
}
