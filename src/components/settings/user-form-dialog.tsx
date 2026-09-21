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
import { CredentialsDialog } from "@/components/credentials-dialog";
import { ApiError } from "@/lib/api-client";
import { createUser, updateUser } from "@/lib/api/settings";
import { useRoles } from "@/hooks/use-roles";
import type { SystemUser } from "@/types/api";

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
  /**
   * Credenciais a comunicar depois de criar.
   *
   * Vive aqui, e não dentro do formulário, porque substitui o formulário: o
   * diálogo fecha e um segundo abre no lugar. Toast não serve — some em
   * segundos, e senha inicial é informação para ler, copiar e repassar.
   */
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const isEdit = Boolean(user);

  if (created) {
    return (
      <CredentialsDialog
        open
        onOpenChange={(next) => {
          if (!next) setCreated(null);
        }}
        title="Usuário criado"
        description="Informe estes dados à pessoa. Ela troca a senha no primeiro acesso, em Minha conta."
        fields={[
          { label: "E-mail", value: created.email },
          { label: "Senha inicial", value: created.password },
        ]}
        note="Esta senha não será exibida de novo. Se precisar, você pode definir uma nova editando o usuário."
      />
    );
  }

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
          onSaved={(credentials) => {
            onOpenChange(false);
            onSaved();
            if (credentials) setCreated(credentials);
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
  /** Recebe as credenciais quando foi o servidor que definiu a senha. */
  onSaved: (credentials?: { email: string; password: string }) => void;
}

interface FormState {
  name: string;
  email: string;
  password: string;
  /** Id do nível, não mais um valor de enum: os níveis são dado da congregação. */
  roleId: string;
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
  const { items: roles, loading: loadingRoles } = useRoles();
  const [form, setForm] = useState<FormState>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    roleId: user?.role?.id ?? "",
    active: user?.active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Não há opção de super admin aqui, e não é esquecimento.
   *
   * Super admin deixou de ser um nível e virou capacidade de plataforma, fora do
   * catálogo de permissões: se fosse escolhível neste formulário, quem administra
   * usuários poderia se conceder acesso a todas as congregações da rede.
   */
  const selectedRole = roles.find((role) => role.id === form.roleId) ?? null;

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};

    if (form.name.trim().length < 3) {
      next.name = "Informe ao menos 3 caracteres.";
    }
    if (!EMAIL_PATTERN.test(form.email.trim())) {
      next.email = "Informe um e-mail válido.";
    }
    // A senha só é validada quando foi digitada: na criação ela nem aparece
    // (o usuário nasce com a padrão) e na edição é uma substituição opcional.
    if (form.password.length > 0 && form.password.length < MIN_PASSWORD_LENGTH) {
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
          roleId: form.roleId,
          active: form.active,
          ...(form.password ? { password: form.password } : {}),
        });
        toast.success("Usuário atualizado.");
      } else {
        const result = await createUser({
          name: form.name.trim(),
          email: form.email.trim(),
          // Sem senha: o servidor usa a padrão da instalação, e a pessoa troca
          // depois em Minha conta. Assim quem cadastra não precisa inventar uma
          // senha nem ficar com a senha de outra pessoa anotada em algum lugar.
          roleId: form.roleId,
        });
        toast.success("Usuário criado.");
        // Entrega as credenciais para o diálogo trocar o formulário pelo modal
        // que as comunica. Só vem preenchido quando foi o SERVIDOR que definiu a
        // senha — se quem cadastrou escolheu uma, ela já sabe qual é.
        onSaved(
          result.initialPassword
            ? { email: result.email, password: result.initialPassword }
            : undefined,
        );
        return;
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

      {isEdit ? (
        <div className="space-y-2">
          <Label htmlFor="user-password">Nova senha</Label>
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
          <p id="user-password-hint" className="text-muted-foreground text-xs">
            Deixe em branco para manter a atual. Mínimo de 8 caracteres.
          </p>
          {errors.password ? <p className="text-destructive text-sm">{errors.password}</p> : null}
        </div>
      ) : (
        <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-2.5 text-sm">
          A pessoa recebe uma <strong className="text-foreground">senha padrão</strong> e a troca no
          primeiro acesso, em Minha conta. Assim você não precisa inventar uma senha nem ficar com a
          senha de outra pessoa anotada.
        </p>
      )}

      <div className="space-y-2">
        {/* "Nível de acesso", e não "Cargo": desde que existe cargo eclesiástico
            no cadastro de membro, chamar as duas coisas de cargo confundiria
            quem preenche. Cargo é o que a pessoa É na igreja; nível é o que ela
            pode fazer no sistema. */}
        <Label htmlFor="user-role">Nível de acesso</Label>
        <Select
          value={form.roleId}
          onValueChange={(value) => setForm((prev) => ({ ...prev, roleId: value }))}
          disabled={saving || loadingRoles}
        >
          <SelectTrigger id="user-role" className="w-full">
            <SelectValue placeholder={loadingRoles ? "Carregando…" : "Selecione o nível"} />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          {selectedRole
            ? `${selectedRole.permissions.length} permissõe(s). Ajuste em Configurações → Níveis de acesso.`
            : "Define o que esta pessoa consegue ver e editar no sistema."}
        </p>
        {errors.roleId ? <p className="text-destructive text-sm">{errors.roleId}</p> : null}
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
