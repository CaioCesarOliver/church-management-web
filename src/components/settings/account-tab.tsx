"use client";

import { KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api-client";
import { changeMyPassword, updateMyAccount } from "@/lib/api/account";
import { useAuth } from "@/lib/auth-context";
import type { AuthUser } from "@/types/api";

const MIN_PASSWORD_LENGTH = 8;

interface AccountTabProps {
  /** The signed-in user. Every role may edit their own account. */
  user: AuthUser;
}

export function AccountTab({ user }: AccountTabProps) {
  return (
    <div className="space-y-4">
      <ProfileCard user={user} />
      <PasswordCard />
    </div>
  );
}

function ProfileCard({ user }: AccountTabProps) {
  const { refreshUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const trimmed = name.trim();
  const dirty = trimmed !== user.name;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (trimmed.length < 3) {
      setErrors({ name: "Informe o nome completo (mínimo de 3 caracteres)." });
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      await updateMyAccount({ name: trimmed });
      // The sidebar reads the name from the cached session, not from this form.
      await refreshUser();
      toast.success("Nome atualizado.");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors);
        toast.error(err.message);
      } else {
        toast.error("Não foi possível atualizar o seu nome.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meus dados</CardTitle>
        <CardDescription>
          Estes dados aparecem para os outros usuários da congregação.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="max-w-md space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="account-name">Nome</Label>
            <Input
              id="account-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nome completo"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "account-name-error" : undefined}
            />
            {errors.name ? (
              <p id="account-name-error" className="text-sm text-destructive">
                {errors.name}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-email">E-mail</Label>
            <Input id="account-email" value={user.email} disabled readOnly />
            <p className="text-xs text-muted-foreground">
              O e-mail de acesso só pode ser alterado por um administrador.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Nível de acesso</span>
            <p>
              <Badge variant="secondary">
                {user.superAdmin ? "Super admin" : (user.role?.name ?? "Sem nível")}
              </Badge>
            </p>
          </div>

          <Button type="submit" disabled={!dirty || saving} className="w-full sm:w-auto">
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Salvar alterações
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const found: Record<string, string> = {};
    if (currentPassword.length === 0) {
      found.currentPassword = "Informe a sua senha atual.";
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      found.newPassword = `A nova senha deve ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    } else if (newPassword !== confirmation) {
      // Checked here so a typo never costs a round trip.
      found.confirmation = "As senhas não conferem.";
    }

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await changeMyPassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      toast.success("Senha alterada.");
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldErrors = err.fieldErrors;
        // A wrong current password arrives as a 422 keyed on `currentPassword`.
        setErrors(
          Object.keys(fieldErrors).length > 0 ? fieldErrors : { currentPassword: err.message },
        );
        toast.error(err.message);
      } else {
        toast.error("Não foi possível alterar a sua senha.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alterar senha</CardTitle>
        <CardDescription>
          A senha atual é exigida para confirmar que é você quem está fazendo a troca.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="max-w-md space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="account-current-password">Senha atual</Label>
            <Input
              id="account-current-password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              aria-invalid={Boolean(errors.currentPassword)}
              aria-describedby={
                errors.currentPassword ? "account-current-password-error" : undefined
              }
            />
            {errors.currentPassword ? (
              <p id="account-current-password-error" className="text-sm text-destructive">
                {errors.currentPassword}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-new-password">Nova senha</Label>
            <Input
              id="account-new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.newPassword)}
              aria-describedby="account-new-password-hint"
            />
            <p id="account-new-password-hint" className="text-xs text-muted-foreground">
              Ao menos {MIN_PASSWORD_LENGTH} caracteres.
            </p>
            {errors.newPassword ? (
              <p className="text-sm text-destructive">{errors.newPassword}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-confirm-password">Confirme a nova senha</Label>
            <Input
              id="account-confirm-password"
              type="password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmation)}
              aria-describedby={errors.confirmation ? "account-confirm-password-error" : undefined}
            />
            {errors.confirmation ? (
              <p id="account-confirm-password-error" className="text-sm text-destructive">
                {errors.confirmation}
              </p>
            ) : null}
          </div>

          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <KeyRound className="size-4" aria-hidden="true" />
            )}
            Alterar senha
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
