"use client";

import { MessageCircleQuestion, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { errorMessage } from "@/components/error-state";
import { ReferralSourceFormDialog } from "@/components/settings/referral-source-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { refreshReferralSources } from "@/hooks/use-referral-sources";
import { deleteReferralSource, listReferralSources } from "@/lib/api/domain";
import { formatNumber } from "@/lib/format";
import type { ReferralSource } from "@/types/api";

interface ReferralSourcesTabProps {
  /** Everyone may read the list; only `canManageSettings` roles may change it. */
  readOnly?: boolean;
}

export function ReferralSourcesTab({ readOnly = false }: ReferralSourcesTabProps) {
  const [sources, setSources] = useState<ReferralSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ReferralSource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReferralSource | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Inactive sources are managed from here, so they have to be visible here.
      setSources(await listReferralSources({ includeInactive: true }));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Keeps the pickers elsewhere in the app in step with what was just changed. */
  async function reload() {
    await Promise.all([load(), refreshReferralSources()]);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(source: ReferralSource) {
    setEditing(source);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteReferralSource(deleteTarget.id);
      toast.success("Origem removida.");
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const nextSortOrder =
    sources.length === 0 ? 0 : Math.max(...sources.map((source) => source.sortOrder)) + 1;

  const deleteCount = deleteTarget?.visitorCount ?? 0;

  const createButton = readOnly ? null : (
    <Button onClick={openCreate} className="w-full sm:w-auto">
      <Plus className="size-4" aria-hidden="true" />
      Nova origem
    </Button>
  );

  const columns: Array<DataTableColumn<ReferralSource>> = [
    {
      key: "name",
      header: "Nome",
      className: "font-medium",
      cell: (source) => source.name,
    },
    {
      key: "sortOrder",
      header: "Ordem",
      width: "w-[100px]",
      hideBelow: "md",
      className: "text-muted-foreground tabular-nums",
      cell: (source) => source.sortOrder,
    },
    {
      key: "active",
      header: "Situação",
      width: "w-[120px]",
      cell: (source) => (
        <Badge variant={source.active ? "secondary" : "outline"}>
          {source.active ? "Ativa" : "Inativa"}
        </Badge>
      ),
    },
    {
      key: "visitorCount",
      header: "Visitantes",
      width: "w-[130px]",
      hideBelow: "sm",
      className: "text-muted-foreground tabular-nums",
      cell: (source) => formatNumber(source.visitorCount ?? 0),
    },
  ];

  if (!readOnly) {
    columns.push({
      key: "actions",
      header: <span className="sr-only">Ações</span>,
      align: "right",
      width: "w-[110px]",
      cell: (source) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Editar ${source.name}`}
            onClick={() => openEdit(source)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Remover ${source.name}`}
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteTarget(source)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          As origens são as opções do campo &ldquo;Como conheceu&rdquo; no cadastro de visitantes.
        </p>
        {createButton}
      </div>

      <DataTable
        columns={columns}
        rows={sources}
        rowKey={(source) => source.id}
        skeletonRows={4}
        loading={loading}
        error={error}
        onRetry={() => void load()}
        errorTitle="Não foi possível carregar as origens"
        empty={
          <EmptyState
            icon={MessageCircleQuestion}
            title="Nenhuma origem cadastrada"
            description="Sem origens, o cadastro de visitantes não consegue registrar como cada pessoa chegou até a congregação."
          >
            {createButton}
          </EmptyState>
        }
      />

      {readOnly ? null : (
        <ReferralSourceFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          referralSource={editing}
          nextSortOrder={nextSortOrder}
          onSaved={() => void reload()}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Remover origem de visitante"
        description={
          <>
            <strong className="text-foreground">{deleteTarget?.name}</strong> deixará de aparecer
            no cadastro de visitantes.
            {deleteCount > 0 ? (
              <>
                {" "}
                Os {formatNumber(deleteCount)} visitantes com esta origem perdem a atribuição, mas
                não são apagados.
              </>
            ) : null}{" "}
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
