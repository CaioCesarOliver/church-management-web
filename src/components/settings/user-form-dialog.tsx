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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api-client";
import { createUser, updateUser } from "@/lib/api/settings";
import { USER_ROLE_DESCRIPTIONS, USER_ROLE_LABELS, USER_ROLE_OPTIONS } from "@/lib/labels";
import type { SystemUser, UserRole } from "@/types/api";

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present for edit, absent for create. */
  user?: SystemUser | null;
  /** Only a SUPER_ADMIN may grant the SUPER_ADMIN role (contract §1.3). */
  canGrantSuperAdmin: boolean;
  onSaved: () => void;
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  canGrantSuperAdmin,
  onSaved,
}: UserFormDialogProps) {
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(user);

  return (
    <Dialog open={open} onOpenChange={saving ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar usuário" : "Novo usuário"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize os dados de acesso deste usuário."
              : "Cadastre um novo acesso ao sistema desta congregação."}
          </DialogDescription>
        </DialogHeader>
        {/* Keyed so switching rows while the dialog is open starts a fresh form,
            instead of resetting the fields from an effect. */}
        <UserForm
          key={user?.id ?? "new"}
          user={user ?? null}
          canGrantSuperAdmin={canGrantSuperAdmin}
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

interface UserFormProps {
  user: SystemUser | null;
  canGrantSuperAdmin: boolean;
  saving: boolean;
  onSavingChange: (saving: boolean) => void;
  onCancel: () => void;
  onSaved: () => void;
}

interface FormState {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  active: boolean;
}

function UserForm({
  user,
  canGrantSuperAdmin,
  saving,
  onSavingChange,
  onCancel,
  onSaved,
}: UserFormProps) {
  const isEdit = user !== null;
  const [form, setForm] = useState<FormState>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    role: user?.role ?? "SECRETARY",
    active: user?.active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * USER_ROLE_OPTIONS excludes SUPER_ADMIN on purpose: it grants cross-congregation
   * access and the API rejects a non-SUPER_ADMIN handing it out. Offer it only to a
   * SUPER_ADMIN — or when the row being edited already has it, so the select can
   * render its current value.
   */
  const roleOptions =
    canGrantSuperAdmin || user?.role === "SUPER_ADMIN"
      ? [
          { value: "SUPER_ADMIN" as UserRole, label: USER_ROLE_LABELS.SUPER_ADMIN },
          ...USER_ROLE_OPTIONS,
        ]
      : USER_ROLE_OPTIONS;

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};

    if (form.name.trim().length < 3) {
      next.name = "Informe ao menos 3 caracteres.";
    }
    if (!EMAIL_PATTERN.test(form.email.trim())) {
      next.email = "Informe um e-mail válido.";
    }
    // On edit the password field is a replacement, not a requirement.
    if ((!isEdit || form.password.length > 0) && form.password.length < MIN_PASSWORD_LENGTH) {
      next.password = `A senha precisa de ao menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    }

    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onSavingChange(true);
    try {
      if (user) {
        await updateUser(user.id, {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          active: form.active,
          ...(form.password ? { password: form.password } : {}),
        });
        toast.success("Usuário atualizado.");
      } else {
        await createUser({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        });
        toast.success("Usuário criado.");
      }
      onSaved();
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldErrors = error.fieldErrors;
        // A duplicate e-mail comes back as a 409 with no per-field detail.
        setErrors(
          error.status === 409 && Object.keys(fieldErrors).length === 0
            ? { email: error.message }
            : fieldErrors,
        );
        toast.error(error.message);
      } else {
        toast.error("Não foi possível salvar o usuário.");
      }
    } finally {
      onSavingChange(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="user-name">Nome</Label>
        <Input
          id="user-name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Maria da Silva"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "user-name-error" : undefined}
        />
        {errors.name ? (
          <p id="user-name-error" className="text-sm text-destructive">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-email">E-mail</Label>
        <Input
          id="user-email"
          type="email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          placeholder="maria@igreja.com"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "user-email-error" : undefined}
        />
        {errors.email ? (
          <p id="user-email-error" className="text-sm text-destructive">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-password">Senha</Label>
        <Input
          id="user-password"
          type="password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          placeholder="••••••••"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby="user-password-hint"
        />
        <p id="user-password-hint" className="text-xs text-muted-foreground">
          {isEdit
            ? "Deixe em branco para manter a atual. Mínimo de 8 caracteres."
            : "Mínimo de 8 caracteres."}
        </p>
        {errors.password ? <p className="text-sm text-destructive">{errors.password}</p> : null}
      </div>

      <div className="space-y-2">
        {/* "Cargo" on screen, `role` in the code: the user thinks in terms of the
            position someone holds in the congregation, not an access level. */}
        <Label htmlFor="user-role">Cargo</Label>
        <Select
          value={form.role}
          onValueChange={(value) => setForm((prev) => ({ ...prev, role: value as UserRole }))}
        >
          <SelectTrigger id="user-role" className="w-full">
            <SelectValue placeholder="Selecione o cargo" />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{USER_ROLE_DESCRIPTIONS[form.role]}</p>
        {errors.role ? <p className="text-sm text-destructive">{errors.role}</p> : null}
      </div>

      {isEdit ? (
        <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label htmlFor="user-active">Usuário ativo</Label>
            <p className="text-xs text-muted-foreground">
              Um usuário inativo não consegue entrar no sistema.
            </p>
          </div>
          <Switch
            id="user-active"
            checked={form.active}
            onCheckedChange={(checked) => setForm((prev) => ({ ...prev, active: checked }))}
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
          {isEdit ? "Salvar alterações" : "Criar usuário"}
        </Button>
      </DialogFooter>
    </form>
  );
}
