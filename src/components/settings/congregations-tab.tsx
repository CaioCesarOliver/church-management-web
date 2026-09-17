"use client";

import { Building2, LogIn, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { errorMessage } from "@/components/error-state";
import { CongregationFormDialog } from "@/components/settings/congregation-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { deleteCongregation, listCongregations, switchCongregation } from "@/lib/api/settings";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Congregation } from "@/types/api";

interface CongregationsTabProps {
  /** The congregation the session is currently scoped to, if any. */
  activeCongregationId: string | null;
}

/**
 * SUPER_ADMIN only. Every other role sees a single congregation — their own —
 * and manages it from "Dados gerais" instead.
 */
export function CongregationsTab({ activeCongregationId }: CongregationsTabProps) {
  const [congregations, setCongregations] = useState<Congregation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Congregation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Congregation | null>(null);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCongregations(await listCongregations());
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(congregation: Congregation) {
    setEditing(congregation);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteCongregation(deleteTarget.id);
      toast.success("Congregação removida.");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      // 409 covers "it is the congregation you are in" and "it is the last active
      // one" — the API message already explains which, in pt-BR.
      toast.error(errorMessage(err));
    }
  }

  async function handleEnter(congregation: Congregation) {
    if (switchingId) return;
    setSwitchingId(congregation.id);
    try {
      await switchCongregation(congregation.id);
      // Every screen holds tenant-scoped data fetched with the previous token.
      // A full reload is the honest way to refetch all of it at once.
      window.location.replace("/");
    } catch (err) {
      setSwitchingId(null);
      toast.error(errorMessage(err));
    }
  }

  const createButton = (
    <Button onClick={openCreate} className="w-full sm:w-auto">
      <Plus className="size-4" aria-hidden="true" />
      Nova congregação
    </Button>
  );

  const columns: Array<DataTableColumn<Congregation>> = [
    {
      key: "name",
      header: "Nome",
      cell: (congregation) => (
        <span className="flex items-center gap-2 font-medium">
          {congregation.name}
          {congregation.id === activeCongregationId ? (
            <Badge variant="secondary" className="font-normal">
              Atual
            </Badge>
          ) : null}
        </span>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      hideBelow: "sm",
      cell: (congregation) => (
        <span className="text-muted-foreground font-mono text-xs">{congregation.slug}</span>
      ),
    },
    {
      key: "active",
      header: "Situação",
      width: "w-[120px]",
      cell: (congregation) => (
        <span className="flex items-center gap-1.5 text-sm whitespace-nowrap">
          <span
            aria-hidden="true"
            className={cn(
              "size-1.5 rounded-full",
              congregation.active ? "bg-primary" : "bg-muted-foreground",
            )}
          />
          {congregation.active ? "Ativa" : "Inativa"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Criada em",
      width: "w-[130px]",
      hideBelow: "lg",
      cell: (congregation) => (
        <span className="text-muted-foreground tabular-nums">
          {formatDate(congregation.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      align: "right",
      width: "w-[190px]",
      cell: (congregation) => {
        const isActive = congregation.id === activeCongregationId;

        return (
          <div className="flex justify-end gap-1">
            {/* Entering the one you are already in would be a no-op reload, so it
                is not offered; an inactive one is refused by the API. */}
            {isActive ? null : congregation.active ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={switchingId !== null}
                onClick={() => void handleEnter(congregation)}
              >
                <LogIn className="size-4" aria-hidden="true" />
                Acessar
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button variant="ghost" size="sm" disabled>
                      <LogIn className="size-4" aria-hidden="true" />
                      Acessar
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left">
                  Reative a congregação para poder acessá-la.
                </TooltipContent>
              </Tooltip>
            )}

            <Button
              variant="ghost"
              size="icon"
              aria-label={`Editar ${congregation.name}`}
              onClick={() => openEdit(congregation)}
            >
              <Pencil className="size-4" />
            </Button>

            {isActive ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* A disabled button fires no pointer events, so the span is
                      what the tooltip can attach to. */}
                  <span className="inline-flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled
                      aria-label={`Não é possível remover ${congregation.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left">
                  Você está dentro desta congregação. Troque para outra antes de removê-la.
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remover ${congregation.name}`}
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(congregation)}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm text-pretty">
          Cada congregação tem seus próprios membros, visitantes, cultos e usuários.
        </p>
        {createButton}
      </div>

      <DataTable
        columns={columns}
        rows={congregations}
        rowKey={(congregation) => congregation.id}
        loading={loading}
        skeletonRows={3}
        error={error}
        onRetry={() => void load()}
        errorTitle="Não foi possível carregar as congregações"
        rowClassName={(congregation) =>
          congregation.id === activeCongregationId ? "bg-primary/5" : undefined
        }
        empty={
          <EmptyState
            icon={Building2}
            title="Nenhuma congregação cadastrada"
            description="Cadastre a primeira congregação para começar a usar o sistema."
          >
            {createButton}
          </EmptyState>
        }
      />

      <CongregationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        congregation={editing}
        onSaved={() => void load()}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Remover congregação"
        description={
          <>
            Todos os membros, visitantes, cultos e presenças de{" "}
            <strong className="text-foreground">{deleteTarget?.name}</strong> serão apagados. Esta
            ação não pode ser desfeita.
          </>
        }
        confirmLabel="Remover"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
