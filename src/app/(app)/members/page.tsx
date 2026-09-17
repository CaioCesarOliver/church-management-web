"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, SearchX, Users } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import type { SortOrder } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { errorMessage } from "@/components/error-state";
import {
  ALL_STATUS,
  isMemberSort,
  MEMBER_SORT_PARAMS,
  type MemberSort,
  type StatusFilter,
} from "@/components/members/member-filters";
import { MemberDetailSheet } from "@/components/members/member-detail-sheet";
import { MemberFormDialog } from "@/components/members/member-form-dialog";
import { MembersFilterBar } from "@/components/members/members-filter-bar";
import { MembersTable } from "@/components/members/members-table";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { deleteMember, listMembers, updateMember } from "@/lib/api/members";
import { useAuth } from "@/lib/auth-context";
import { canWrite, MEMBER_STATUS_LABELS } from "@/lib/labels";
import type { Member, Paginated } from "@/types/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const PAGE_SIZE = 20;

export default function MembersPage() {
  const { user } = useAuth();
  const writer = canWrite(user?.role);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState<StatusFilter>(ALL_STATUS);
  const [onlyAbsenceAlert, setOnlyAbsenceAlert] = useState(false);
  const [sort, setSort] = useState<MemberSort>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>(MEMBER_SORT_PARAMS.name.sortOrder);
  const [page, setPage] = useState(1);

  const [data, setData] = useState<Paginated<Member> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) setLoading(true);
      setError(null);
      try {
        const result = await listMembers({
          search: debouncedSearch.trim() || undefined,
          status: status === ALL_STATUS ? undefined : status,
          inAbsenceAlert: onlyAbsenceAlert ? true : undefined,
          sortBy: MEMBER_SORT_PARAMS[sort].sortBy,
          sortOrder,
          page,
          pageSize: PAGE_SIZE,
        });
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, status, onlyAbsenceAlert, sort, sortOrder, page],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const items = data?.items ?? [];
  const hasFilters = search.trim() !== "" || status !== ALL_STATUS || onlyAbsenceAlert;

  function clearFilters() {
    setSearch("");
    setStatus(ALL_STATUS);
    setOnlyAbsenceAlert(false);
    setPage(1);
  }

  /** The select picks the field and its natural direction. */
  function changeSort(value: MemberSort) {
    setSort(value);
    setSortOrder(MEMBER_SORT_PARAMS[value].sortOrder);
    setPage(1);
  }

  /**
   * Header clicks and the select drive the same state, so they cannot disagree:
   * clicking another column is exactly picking it in the select, and clicking the
   * column already sorted only flips the direction.
   */
  function toggleSort(key: string) {
    if (!isMemberSort(key)) return;
    if (key === sort) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      setPage(1);
      return;
    }
    changeSort(key);
  }

  function openCreate() {
    setEditingMember(null);
    setFormOpen(true);
  }

  function openEdit(member: Member) {
    setDetailOpen(false);
    setEditingMember(member);
    setFormOpen(true);
  }

  function openDelete(member: Member) {
    setDetailOpen(false);
    setDeleteTarget(member);
  }

  function openDetail(member: Member) {
    setDetailId(member.id);
    setDetailOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMember(deleteTarget.id);
      toast.success(`${deleteTarget.name} foi excluído.`);
      // Deleting the only row on the last page would otherwise leave it empty.
      if (items.length === 1 && page > 1) setPage(page - 1);
      else await load({ silent: true });
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function handleToggleStatus(member: Member) {
    const nextStatus = member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const previous = data;

    // Optimistic: a status flip is a single field and the row is already on screen.
    setData((current) =>
      current
        ? {
            ...current,
            items: current.items.map((row) =>
              row.id === member.id ? { ...row, status: nextStatus } : row,
            ),
          }
        : current,
    );

    try {
      await updateMember(member.id, { status: nextStatus });
      toast.success(`${member.name} agora está ${MEMBER_STATUS_LABELS[nextStatus].toLowerCase()}.`);
      // The row may no longer match the active status filter.
      await load({ silent: true });
    } catch (err) {
      setData(previous);
      toast.error(errorMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Membros" description="Cadastro e acompanhamento da congregação">
        {writer ? (
          <Button onClick={openCreate} className="w-full sm:w-auto">
            <Plus />
            Novo membro
          </Button>
        ) : null}
      </PageHeader>

      <MembersFilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        status={status}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        onlyAbsenceAlert={onlyAbsenceAlert}
        onOnlyAbsenceAlertChange={(value) => {
          setOnlyAbsenceAlert(value);
          setPage(1);
        }}
        sort={sort}
        onSortChange={changeSort}
      />

      <MembersTable
        members={items}
        canWrite={writer}
        loading={loading}
        error={error}
        onRetry={() => void load()}
        empty={
          hasFilters ? (
            <EmptyState
              icon={SearchX}
              title="Nenhum membro encontrado com esses filtros."
              description="Ajuste a busca ou remova os filtros para ver a congregação inteira."
            >
              <Button variant="outline" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </EmptyState>
          ) : (
            <EmptyState
              icon={Users}
              title="Nenhum membro cadastrado"
              description="Cadastre os membros da congregação para acompanhar presença e assiduidade."
            >
              {writer ? (
                <Button onClick={openCreate}>
                  <Plus />
                  Novo membro
                </Button>
              ) : null}
            </EmptyState>
          )
        }
        meta={data?.meta}
        onPageChange={setPage}
        sort={{ key: sort, order: sortOrder }}
        onSortChange={toggleSort}
        onOpenDetail={openDetail}
        onEdit={openEdit}
        onDelete={openDelete}
        onToggleStatus={(member) => void handleToggleStatus(member)}
      />

      <MemberDetailSheet
        memberId={detailId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        canWrite={writer}
        onEdit={openEdit}
        onDelete={openDelete}
      />

      <MemberFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        member={editingMember}
        onSaved={() => void load({ silent: true })}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={deleteTarget ? `Excluir ${deleteTarget.name}?` : "Excluir membro?"}
        description={
          <span className="space-y-2">
            <span className="block">
              Todo o histórico de presença do membro será apagado junto com o cadastro, e as
              métricas dos cultos passados serão recalculadas. Esta ação não pode ser desfeita.
            </span>
            <span className="block">
              Se a intenção é apenas parar de acompanhar esta pessoa, marque o cadastro como{" "}
              <strong className="text-foreground">Inativo</strong>: o histórico é preservado e ela
              deixa de contar nos alertas de ausência.
            </span>
          </span>
        }
        confirmLabel="Excluir definitivamente"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
