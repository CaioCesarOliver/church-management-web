"use client";

import { CircleCheckBig, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api-client";
import { createUser } from "@/lib/api/settings";
import type { Role } from "@/types/api";

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface CreatedAccess {
  roleId: string;
  roleName: string;
  name: string;
  email: string;
}

interface AccessCardProps {
  /** O nível vem da congregação recém-criada, não de uma lista fixa no código. */
  role: Role;
  /** The congregation created in step 1 — these users are created inside it. */
  congregationId: string;
  created: CreatedAccess | null;
  onCreated: (access: CreatedAccess) => void;
}

/**
 * One optional account for the new congregation. Each card submits on its own so
 * a failure on, say, the pastor's e-mail does not cost the administrator that
 * was already typed in.
 */
export function AccessCard({ role, congregationId, created, onCreated }: AccessCardProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const idPrefix = `access-${role.id}`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const found: Record<string, string> = {};
    if (name.trim().length < 3) {
      found.name = "Informe ao menos 3 caracteres.";
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      found.email = "Informe um e-mail válido.";
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      found.password = `A senha precisa de ao menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await createUser({
        name: name.trim(),
        email: email.trim(),
        password,
        roleId: role.id,
        // The super admin has no active congregation yet, so the API cannot
        // infer the tenant from the token — it has to be named explicitly.
        congregationId,
      });
      toast.success(`Acesso de ${role.name.toLowerCase()} criado.`);
      onCreated({ roleId: role.id, roleName: role.name, name: name.trim(), email: email.trim() });
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
        toast.error("Não foi possível criar o acesso.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (created) {
    return (
      <Card className="border-primary/40 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CircleCheckBig className="size-4 text-primary" aria-hidden="true" />
            {role.name}
          </CardTitle>
          <CardDescription>Acesso criado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0.5 text-sm">
          <p className="font-medium break-words">{created.name}</p>
          <p className="text-muted-foreground break-all">{created.email}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{role.name}</CardTitle>
        <CardDescription>
          {role.permissions.length} permissõe(s). Ajustável depois em Configurações.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-name`}>Nome</Label>
            <Input
              id={`${idPrefix}-name`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Maria da Silva"
              autoComplete="off"
              disabled={saving}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? `${idPrefix}-name-error` : undefined}
            />
            {errors.name ? (
              <p id={`${idPrefix}-name-error`} className="text-sm text-destructive">
                {errors.name}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-email`}>E-mail</Label>
            <Input
              id={`${idPrefix}-email`}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="maria@igreja.com"
              autoComplete="off"
              disabled={saving}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? `${idPrefix}-email-error` : undefined}
            />
            {errors.email ? (
              <p id={`${idPrefix}-email-error`} className="text-sm text-destructive">
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-password`}>Senha</Label>
            <Input
              id={`${idPrefix}-password`}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={saving}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={`${idPrefix}-password-hint`}
            />
            <p id={`${idPrefix}-password-hint`} className="text-xs text-muted-foreground">
              Mínimo de 8 caracteres.
            </p>
            {errors.password ? (
              <p className="text-sm text-destructive">{errors.password}</p>
            ) : null}
          </div>

          <Button type="submit" variant="outline" className="w-full" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Criar acesso
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
