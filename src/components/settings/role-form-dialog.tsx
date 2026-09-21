"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PermissionMatrix } from "@/components/settings/permission-matrix";
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
import { createRole, listPermissionAreas, updateRole } from "@/lib/api/roles";
import type { PermissionArea, Role } from "@/types/api";

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` abre em modo de criação. */
  role: Role | null;
  onSaved: () => void;
}

export function RoleFormDialog({ open, onOpenChange, role, onSaved }: RoleFormDialogProps) {
  const isEditing = role !== null;
  const [areas, setAreas] = useState<PermissionArea[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // O catálogo é constante do servidor; buscar uma vez ao abrir basta.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingAreas(true);
    listPermissionAreas()
      .then((result) => {
        if (!cancelled) setAreas(result);
      })
      .catch(() => {
        if (!cancelled) setAreas([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingAreas(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Reabrir com outra linha tem que recomeçar o formulário, não herdar o anterior.
  useEffect(() => {
    if (!open) return;
    setName(role?.name ?? "");
    setPermissions(role?.permissions ?? []);
    setActive(role?.active ?? true);
    setErrors({});
  }, [open, role]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setErrors({ name: "Informe ao menos 2 caracteres." });
      return;
    }
    setErrors({});

    setSaving(true);
    try {
      if (role) {
        await updateRole(role.id, { name: trimmed, permissions, active });
        toast.success("Nível atualizado.");
      } else {
        await createRole({ name: trimmed, permissions, active });
        toast.success("Nível criado.");
      }
      onOpenChange(false);
      onSaved();
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldErrors = error.fieldErrors;
        // Nome duplicado e as travas de auto-trancamento vêm como 409 sem
        // detalhe por campo — a mensagem do servidor explica o motivo.
        setErrors(
          Object.keys(fieldErrors).length === 0 ? { name: error.message } : fieldErrors,
        );
        toast.error(error.message);
      } else {
        toast.error("Não foi possível salvar o nível.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={saving ? undefined : onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar nível de acesso" : "Novo nível de acesso"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Ajuste o nome e o que este nível enxerga e edita."
              : "Dê um nome e escolha, tela a tela, o que este nível pode fazer."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="role-name">Nome</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Recepcionista"
              disabled={saving || role?.system}
              autoFocus
              aria-invalid={Boolean(errors.name)}
            />
            {role?.system ? (
              <p className="text-muted-foreground text-xs">
                Níveis padrão não podem ser renomeados, mas as permissões continuam ajustáveis.
              </p>
            ) : null}
            {errors.name ? <p className="text-destructive text-sm">{errors.name}</p> : null}
          </div>

          <PermissionMatrix
            areas={areas}
            loading={loadingAreas}
            value={permissions}
            onChange={setPermissions}
            disabled={saving}
          />
          {errors.permissions ? (
            <p className="text-destructive text-sm">{errors.permissions}</p>
          ) : null}

          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="role-active">Nível ativo</Label>
              <p className="text-muted-foreground text-xs">
                Um nível inativo some do formulário de usuário, mas quem já está nele continua com
                as permissões.
              </p>
            </div>
            <Switch
              id="role-active"
              checked={active}
              onCheckedChange={setActive}
              disabled={saving}
            />
          </div>

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
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEditing ? "Salvar alterações" : "Criar nível"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
