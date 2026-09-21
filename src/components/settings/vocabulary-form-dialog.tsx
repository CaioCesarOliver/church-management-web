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

/** O mínimo que uma lista da congregação precisa ter para caber aqui. */
export interface VocabularyItem {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
}

/** Os textos que mudam de uma lista para outra. */
export interface VocabularyCopy {
  /** "cargo", "departamento" — minúsculo, no singular. */
  noun: string;
  createTitle: string;
  editTitle: string;
  createDescription: string;
  editDescription: string;
  namePlaceholder: string;
  /** O que acontece com quem já está vinculado quando a lista é desativada. */
  inactiveHint: string;
  createSubmitLabel: string;
}

interface VocabularyFormDialogProps<T extends VocabularyItem> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` abre em modo de criação. */
  item: T | null;
  copy: VocabularyCopy;
  onCreate: (input: { name: string; active: boolean }) => Promise<unknown>;
  onUpdate: (id: string, input: { name: string; active: boolean }) => Promise<unknown>;
  onSaved: () => void;
}

/**
 * Formulário de uma lista da congregação: nome e situação, e nada mais.
 *
 * NÃO tem campo de ordem, de propósito. A ordem é definida arrastando na
 * tabela; um número digitado ao lado do arrastar são dois jeitos de fazer a
 * mesma coisa, e o segundo é o que ninguém entende — "ordem 3" não diz nada
 * sobre onde a linha vai parar.
 */
export function VocabularyFormDialog<T extends VocabularyItem>({
  open,
  onOpenChange,
  item,
  copy,
  onCreate,
  onUpdate,
  onSaved,
}: VocabularyFormDialogProps<T>) {
  const isEditing = item !== null;
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open={open} onOpenChange={saving ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? copy.editTitle : copy.createTitle}</DialogTitle>
          <DialogDescription>
            {isEditing ? copy.editDescription : copy.createDescription}
          </DialogDescription>
        </DialogHeader>

        {/* Keyed so switching rows while the dialog is open starts a fresh form,
            instead of resetting the fields from an effect. */}
        <VocabularyForm
          key={item?.id ?? "new"}
          item={item}
          copy={copy}
          saving={saving}
          onSavingChange={setSaving}
          onCreate={onCreate}
          onUpdate={onUpdate}
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

interface VocabularyFormProps<T extends VocabularyItem> {
  item: T | null;
  copy: VocabularyCopy;
  saving: boolean;
  onSavingChange: (saving: boolean) => void;
  onCreate: (input: { name: string; active: boolean }) => Promise<unknown>;
  onUpdate: (id: string, input: { name: string; active: boolean }) => Promise<unknown>;
  onCancel: () => void;
  onSaved: () => void;
}

function VocabularyForm<T extends VocabularyItem>({
  item,
  copy,
  saving,
  onSavingChange,
  onCreate,
  onUpdate,
  onCancel,
  onSaved,
}: VocabularyFormProps<T>) {
  const [name, setName] = useState(item?.name ?? "");
  const [active, setActive] = useState(item?.active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setErrors({ name: "Informe ao menos 2 caracteres." });
      return;
    }
    setErrors({});

    onSavingChange(true);
    try {
      if (item) {
        await onUpdate(item.id, { name: trimmedName, active });
        toast.success(`${capitalize(copy.noun)} atualizado.`);
      } else {
        await onCreate({ name: trimmedName, active });
        toast.success(`${capitalize(copy.noun)} criado.`);
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
        toast.error(`Não foi possível salvar o ${copy.noun}.`);
      }
    } finally {
      onSavingChange(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="vocabulary-name">Nome</Label>
        <Input
          id="vocabulary-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={copy.namePlaceholder}
          disabled={saving}
          autoFocus
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "vocabulary-name-error" : undefined}
        />
        {errors.name ? (
          <p id="vocabulary-name-error" className="text-destructive text-sm">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="vocabulary-active">Ativo</Label>
          <p className="text-muted-foreground text-xs">{copy.inactiveHint}</p>
        </div>
        <Switch
          id="vocabulary-active"
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
          {item ? "Salvar alterações" : copy.createSubmitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
