"use client";

import { Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useReferralSources } from "@/hooks/use-referral-sources";
import { ApiError } from "@/lib/api-client";
import { createVisitor, updateVisitor } from "@/lib/api/visitors";
import type { Visitor } from "@/types/api";

interface VisitorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` opens the dialog in "create" mode. */
  visitor: Visitor | null;
  onSaved: () => void;
}

/** shadcn's Select rejects an empty string, so "não informado" needs a sentinel. */
const REFERRAL_NONE = "__none__";

interface FormState {
  name: string;
  phone: string;
  email: string;
  referralSourceId: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  phone: "",
  email: "",
  referralSourceId: REFERRAL_NONE,
  notes: "",
};

function toFormState(visitor: Visitor | null): FormState {
  if (!visitor) return EMPTY_FORM;
  return {
    name: visitor.name,
    phone: visitor.phone ?? "",
    email: visitor.email ?? "",
    referralSourceId: visitor.referralSource?.id ?? REFERRAL_NONE,
    notes: visitor.notes ?? "",
  };
}

/** The API treats `null` as "clear this field"; an empty input means the same. */
function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function VisitorFormDialog({
  open,
  onOpenChange,
  visitor,
  onSaved,
}: VisitorFormDialogProps) {
  const editing = visitor !== null;
  const { items: referralSources, loading: loadingSources } = useReferralSources();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(toFormState(visitor));
      setFieldErrors({});
    }
  }, [open, visitor]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (form.name.trim().length < 3) {
      setFieldErrors({ name: "Informe o nome completo (mínimo de 3 caracteres)." });
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: orNull(form.phone),
      email: orNull(form.email),
      referralSourceId: form.referralSourceId === REFERRAL_NONE ? null : form.referralSourceId,
      notes: orNull(form.notes),
    };

    setSaving(true);
    setFieldErrors({});
    try {
      if (visitor) {
        await updateVisitor(visitor.id, payload);
        toast.success("Visitante atualizado.");
      } else {
        await createVisitor(payload);
        toast.success("Visitante cadastrado.");
      }
      onOpenChange(false);
      onSaved();
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fieldErrors);
        toast.error(error.message);
      } else {
        toast.error("Não foi possível salvar o visitante.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={saving ? undefined : onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar visitante" : "Novo visitante"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Atualize os dados de contato e a origem da visita."
              : "Registre quem visitou a congregação para acompanhar o retorno."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="visitor-name">Nome</Label>
            <Input
              id="visitor-name"
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
              placeholder="Nome completo"
              autoComplete="name"
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "visitor-name-error" : undefined}
            />
            {fieldErrors.name ? (
              <p id="visitor-name-error" className="text-destructive text-xs">
                {fieldErrors.name}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="visitor-phone">Telefone</Label>
              <Input
                id="visitor-phone"
                value={form.phone}
                onChange={(event) => setField("phone", event.target.value)}
                placeholder="(11) 98888-7777"
                inputMode="tel"
                autoComplete="tel"
                aria-invalid={Boolean(fieldErrors.phone)}
                aria-describedby={fieldErrors.phone ? "visitor-phone-error" : undefined}
              />
              {fieldErrors.phone ? (
                <p id="visitor-phone-error" className="text-destructive text-xs">
                  {fieldErrors.phone}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="visitor-email">E-mail</Label>
              <Input
                id="visitor-email"
                type="email"
                value={form.email}
                onChange={(event) => setField("email", event.target.value)}
                placeholder="nome@email.com"
                autoComplete="email"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "visitor-email-error" : undefined}
              />
              {fieldErrors.email ? (
                <p id="visitor-email-error" className="text-destructive text-xs">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visitor-referral">Como conheceu</Label>
            {loadingSources ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <Select
                value={form.referralSourceId}
                onValueChange={(value) => setField("referralSourceId", value)}
              >
                <SelectTrigger id="visitor-referral" className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={REFERRAL_NONE}>Não informado</SelectItem>
                  {referralSources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {!loadingSources && referralSources.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                Nenhuma origem cadastrada. Um administrador pode criá-las em Configurações.
              </p>
            ) : null}

            {fieldErrors.referralSourceId ? (
              <p className="text-destructive text-xs">{fieldErrors.referralSourceId}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="visitor-notes">Observações</Label>
            <Textarea
              id="visitor-notes"
              value={form.notes}
              onChange={(event) => setField("notes", event.target.value)}
              placeholder="Pedidos de oração, contexto da visita, próximos passos…"
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
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {editing ? "Salvar alterações" : "Cadastrar visitante"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
