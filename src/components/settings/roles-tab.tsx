"use client";

import { KeyRound, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { ErrorState, errorMessage } from "@/components/error-state";
import { RoleFormDialog } from "@/components/settings/role-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { refreshRoles } from "@/hooks/use-roles";
import { deleteRole, listRoles } from "@/lib/api/roles";
import { formatNumber } from "@/lib/format";
import type { Role } from "@/types/api";

/**
 * Níveis de acesso da congregação.
 *
 * Quem administra cria níveis novos e escolhe, tela a tela, o que cada um vê e
 * edita. Os três que nascem com a congregação (Administrador, Secretária,
 * Recepcionista) são `system`: renomeáveis nas permissões, mas não excluíveis —
 * apagar o último nível administrativo deixaria a congregação sem ninguém
 * capaz de devolver a permissão.
 */
export function RolesTab({ readOnly = false }: { readOnly?: boolean }) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Inativos são administrados aqui, então precisam aparecer aqui.
      setRoles(await listRoles({ includeInactive: true }));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function reload() {
    await Promise.all([load(), refreshRoles()]);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteRole(deleteTarget.id);
      toast.success("Nível removido.");
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      // Nível de sistema ou com usuários dentro responde 409 explicando o motivo.
      toast.error(errorMessage(err));
    }
  }

  const columns: Array<DataTableColumn<Role>> = [
    {
      key: "name",
      header: "Nível",
      cell: (role) => (
        <span className="flex items-center gap-2 font-medium">
          {role.name}
          {role.system ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-muted-foreground inline-flex">
                  <Lock className="size-3.5" aria-label="Nível padrão" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                Nível padrão: permissões ajustáveis, mas não pode ser excluído.
              </TooltipContent>
            </Tooltip>
          ) : null}
        </span>
      ),
    },
    {
      key: "permissions",
      header: "Permissões",
      width: "w-[130px]",
      cell: (role) => (
        <span className="text-muted-foreground tabular-nums">
          {formatNumber(role.permissions.length)}
        </span>
      ),
    },
    {
      key: "users",
      header: "Usuários",
      width: "w-[120px]",
      hideBelow: "sm",
      cell: (role) => (
        <span className="text-muted-foreground tabular-nums">{formatNumber(role.userCount)}</span>
      ),
    },
    {
      key: "active",
      header: "Situação",
      width: "w-[120px]",
      hideBelow: "md",
      cell: (role) => (
        <Badge variant={role.active ? "secondary" : "outline"}>
          {role.active ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
  ];

  if (!readOnly) {
    columns.push({
      key: "actions",
      header: <span className="sr-only">Ações</span>,
      width: "w-[110px]",
      align: "right",
      cell: (role) => {
        // Duas razões diferentes para não poder excluir, e a pessoa precisa
        // saber qual é a dela: nível padrão nunca sai; nível com gente dentro
        // sai depois de mover essas pessoas.
        const blocked = role.system
          ? "Níveis padrão não podem ser excluídos. Desative-o se não for usá-lo."
          : role.userCount > 0
            ? `${formatNumber(role.userCount)} usuário(s) neste nível. Mova essas pessoas antes.`
            : null;

        return (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Editar ${role.name}`}
              onClick={() => {
                setEditing(role);
                setFormOpen(true);
              }}
            >
              <Pencil className="size-4" />
            </Button>

            {blocked ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled
                      aria-label={`Não é possível remover ${role.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left">{blocked}</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remover ${role.name}`}
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(role)}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        );
      },
    });
  }

  const createButton = readOnly ? null : (
    <Button
      onClick={() => {
        setEditing(null);
        setFormOpen(true);
      }}
      className="w-full sm:w-auto"
    >
      <Plus className="size-4" aria-hidden="true" />
      Novo nível
    </Button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          Cada nível define o que a pessoa enxerga e o que pode alterar, tela a tela. Crie quantos
          precisar — recepção, tesouraria, liderança de departamento.
        </p>
        {createButton}
      </div>

      {!loading && error ? (
        <Card className="py-0">
          <CardContent className="p-0">
            <ErrorState
              error={error}
              onRetry={() => void load()}
              title="Não foi possível carregar os níveis de acesso"
            />
          </CardContent>
        </Card>
      ) : null}

      {!error ? (
        <DataTable
          rows={roles}
          columns={columns}
          loading={loading}
          rowKey={(role) => role.id}
          empty={
            <EmptyState
              icon={KeyRound}
              title="Nenhum nível de acesso"
              description="Sem níveis não é possível criar usuários — cada pessoa precisa de um para saber o que pode fazer."
            >
              {createButton}
            </EmptyState>
          }
        />
      ) : null}

      {readOnly ? null : (
        <RoleFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          role={editing}
          onSaved={() => void reload()}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Remover nível de acesso"
        description={
          <>
            <strong className="text-foreground">{deleteTarget?.name}</strong> deixará de existir.
            Esta ação não pode ser desfeita.
          </>
        }
        confirmLabel="Remover"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
