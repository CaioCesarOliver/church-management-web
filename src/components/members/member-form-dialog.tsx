"use client";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/date-picker";
import { errorMessage } from "@/components/error-state";
import { ApiError } from "@/lib/api-client";
import { createMember, updateMember, type MemberInput } from "@/lib/api/members";
import { MEMBER_STATUS_OPTIONS } from "@/lib/labels";
import type { Member, MemberStatus } from "@/types/api";

interface MemberFormValues {
  name: string;
  phone: string;
  email: string;
  birthDate: string;
  baptismDate: string;
  address: string;
  notes: string;
  status: MemberStatus;
}

const EMPTY_VALUES: MemberFormValues = {
  name: "",
  phone: "",
  email: "",
  birthDate: "",
  baptismDate: "",
  address: "",
  notes: "",
  status: "ACTIVE",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toFormValues(member: Member): MemberFormValues {
  return {
    name: member.name,
    phone: member.phone ?? "",
    email: member.email ?? "",
    birthDate: member.birthDate ?? "",
    baptismDate: member.baptismDate ?? "",
    address: member.address ?? "",
    notes: member.notes ?? "",
    status: member.status,
  };
}

/** The API stores absent optional fields as null; `""` would be a real value. */
function nullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

interface MemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null creates a new member; a member edits it. */
  member: Member | null;
  onSaved: () => void;
}

export function MemberFormDialog({
  open,
  onOpenChange,
  member,
  onSaved,
}: MemberFormDialogProps) {
  const isEditing = member !== null;
  const [values, setValues] = useState<MemberFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(member ? toFormValues(member) : EMPTY_VALUES);
    setErrors({});
  }, [open, member]);

  function setField<K extends keyof MemberFormValues>(key: K, value: MemberFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (values.name.trim().length < 3) {
      next.name = "Informe o nome com pelo menos 3 caracteres.";
    }
    if (values.email.trim() !== "" && !EMAIL_PATTERN.test(values.email.trim())) {
      next.email = "Informe um e-mail válido.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;

    const payload: MemberInput = {
      name: values.name.trim(),
      phone: nullable(values.phone),
      email: nullable(values.email),
      // `DatePicker` already yields YYYY-MM-DD, which is exactly what the
      // `@db.Date` columns expect. Converting to an ISO datetime here would shift
      // the stored day by the browser's timezone offset.
      birthDate: nullable(values.birthDate),
      baptismDate: nullable(values.baptismDate),
      address: nullable(values.address),
      notes: nullable(values.notes),
      // Status is only part of the form while editing; new members default to ACTIVE.
      ...(isEditing ? { status: values.status } : {}),
    };

    setSaving(true);
    try {
      if (member) {
        await updateMember(member.id, payload);
        toast.success("Membro atualizado.");
      } else {
        await createMember(payload);
        toast.success("Membro cadastrado.");
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) {
        // Validation paths may arrive scoped ("body.email"); the form keys on the field.
        const fieldErrors = Object.fromEntries(
          Object.entries(err.fieldErrors).map(([path, message]) => [
            path.split(".").pop() ?? path,
            message,
          ]),
        );
        if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);
      }
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={saving ? undefined : onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar membro" : "Novo membro"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados cadastrais deste membro."
              : "Cadastre um novo membro da congregação. Apenas o nome é obrigatório."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="member-name">Nome</Label>
            <Input
              id="member-name"
              value={values.name}
              onChange={(event) => setField("name", event.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "member-name-error" : undefined}
              autoComplete="name"
              placeholder="Maria Souza"
            />
            {errors.name ? (
              <p id="member-name-error" className="text-xs text-destructive">
                {errors.name}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="member-phone">Telefone</Label>
              <Input
                id="member-phone"
                value={values.phone}
                onChange={(event) => setField("phone", event.target.value)}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "member-phone-error" : undefined}
                inputMode="tel"
                autoComplete="tel"
                placeholder="(11) 98888-7777"
              />
              {errors.phone ? (
                <p id="member-phone-error" className="text-xs text-destructive">
                  {errors.phone}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-email">E-mail</Label>
              <Input
                id="member-email"
                type="email"
                value={values.email}
                onChange={(event) => setField("email", event.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "member-email-error" : undefined}
                autoComplete="email"
                placeholder="maria@exemplo.com"
              />
              {errors.email ? (
                <p id="member-email-error" className="text-xs text-destructive">
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-birth-date">Data de nascimento</Label>
              <DatePicker
                id="member-birth-date"
                value={values.birthDate || null}
                onChange={(value) => setField("birthDate", value ?? "")}
                bounds="past"
                toYear={new Date().getFullYear()}
                placeholder="Selecione a data"
                aria-invalid={Boolean(errors.birthDate)}
                aria-describedby={errors.birthDate ? "member-birth-date-error" : undefined}
              />
              {errors.birthDate ? (
                <p id="member-birth-date-error" className="text-xs text-destructive">
                  {errors.birthDate}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-baptism-date">Data de batismo</Label>
              <DatePicker
                id="member-baptism-date"
                value={values.baptismDate || null}
                onChange={(value) => setField("baptismDate", value ?? "")}
                bounds="past"
                toYear={new Date().getFullYear()}
                placeholder="Selecione a data"
                aria-invalid={Boolean(errors.baptismDate)}
                aria-describedby={errors.baptismDate ? "member-baptism-date-error" : undefined}
              />
              {errors.baptismDate ? (
                <p id="member-baptism-date-error" className="text-xs text-destructive">
                  {errors.baptismDate}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="member-address">Endereço</Label>
            <Input
              id="member-address"
              value={values.address}
              onChange={(event) => setField("address", event.target.value)}
              aria-invalid={Boolean(errors.address)}
              autoComplete="street-address"
              placeholder="Rua das Flores, 100 — Centro"
            />
            {errors.address ? <p className="text-xs text-destructive">{errors.address}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="member-notes">Observações</Label>
            <Textarea
              id="member-notes"
              value={values.notes}
              onChange={(event) => setField("notes", event.target.value)}
              aria-invalid={Boolean(errors.notes)}
              rows={3}
              placeholder="Anotações pastorais, pedidos de oração, etc."
            />
            {errors.notes ? <p className="text-xs text-destructive">{errors.notes}</p> : null}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Label htmlFor="member-status">Status</Label>
              <Select
                value={values.status}
                onValueChange={(value) => setField("status", value as MemberStatus)}
              >
                <SelectTrigger id="member-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEMBER_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Membros inativos deixam de contar nas métricas de presença, mas mantêm todo o
                histórico.
              </p>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? <Loader2 className="animate-spin" /> : null}
              {isEditing ? "Salvar alterações" : "Cadastrar membro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
