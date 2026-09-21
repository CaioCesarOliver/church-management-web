"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { errorMessage } from "@/components/error-state";
import {
  EMPTY_FILTERS,
  hasActiveFilters,
  MeetingFilters,
  toMeetingTypeIdParam,
  type MeetingFiltersValue,
} from "@/components/meetings/meeting-filters";
import { MeetingFormDialog } from "@/components/meetings/meeting-form-dialog";
import { MeetingTable } from "@/components/meetings/meeting-table";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { P, can } from "@/lib/permissions";
import { deleteMeeting, listMeetings } from "@/lib/api/meetings";
import { useAuth } from "@/lib/auth-context";
import { formatDateTime } from "@/lib/format";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { Meeting, PaginationMeta } from "@/types/api";

const PAGE_SIZE = 20;

const INITIAL_META: PaginationMeta = {
  page: 1,
  pageSize: PAGE_SIZE,
  total: 0,
  totalPages: 0,
};

export default function MeetingsPage() {
  const { user } = useAuth();
  const editable = can(user, P.meetingsManage);

  const [filters, setFilters] = useState<MeetingFiltersValue>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(filters.search);

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(INITIAL_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);
  /** Bumped on every open so the form dialog remounts with fresh values. */
  const [formSession, setFormSession] = useState(0);
  const [pendingDeletion, setPendingDeletion] = useState<Meeting | null>(null);

  const search = debouncedSearch.trim();
  const { meetingTypeId, from, to } = filters;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listMeetings({
        search: search || undefined,
        meetingTypeId: toMeetingTypeIdParam(meetingTypeId),
        from: from || undefined,
        to: to || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setMeetings(result.items);
      setMeta(result.meta);
    } catch (err) {
      setError(err);
      setMeetings([]);
      setMeta(INITIAL_META);
    } finally {
      setLoading(false);
    }
  }, [search, meetingTypeId, from, to, page]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Any filter change goes back to page 1 — otherwise a narrower result set strands the user on an empty page. */
  function updateFilters(next: MeetingFiltersValue) {
    setFilters(next);
    setPage(1);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }

  function openCreate() {
    setEditing(null);
    setFormSession((current) => current + 1);
    setFormOpen(true);
  }

  function openEdit(meeting: Meeting) {
    setEditing(meeting);
    setFormSession((current) => current + 1);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!pendingDeletion) return;
    try {
      await deleteMeeting(pendingDeletion.id);
      toast.success("Culto excluído.");
      // ConfirmDialog closes itself once this resolves, which clears the selection.
      // Deleting the only row of the last page would leave it empty.
      if (meetings.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await load();
      }
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  // Reflects the filters that were actually sent, so the debounce cannot make an
  // unfiltered empty list look like a filtered one.
  const filtered = hasActiveFilters({ search, meetingTypeId, from, to });

  return (
    <div className="space-y-4">
      <PageHeader title="Cultos" description="Registro dos encontros da congregação">
        {editable ? (
          <Button onClick={openCreate} className="w-full sm:w-auto">
            <Plus className="size-4" aria-hidden="true" />
            Novo culto
          </Button>
        ) : null}
      </PageHeader>

      <MeetingFilters value={filters} onChange={updateFilters} onClear={clearFilters} />

      <MeetingTable
        meetings={meetings}
        canEdit={editable}
        loading={loading}
        error={error}
        onRetry={() => void load()}
        empty={
          filtered ? (
            <EmptyState
              icon={CalendarDays}
              title="Nenhum culto encontrado com esses filtros."
              description="Ajuste o período, o tipo ou o termo buscado para ver outros registros."
            >
              <Button variant="outline" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </EmptyState>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="Nenhum culto registrado"
              description="Registre o primeiro culto para começar a fazer a chamada."
            >
              {editable ? (
                <Button onClick={openCreate}>
                  <Plus className="size-4" aria-hidden="true" />
                  Novo culto
                </Button>
              ) : null}
            </EmptyState>
          )
        }
        meta={meta}
        onPageChange={setPage}
        onEdit={openEdit}
        onDelete={setPendingDeletion}
      />

      {editable ? (
        <MeetingFormDialog
          key={formSession}
          open={formOpen}
          onOpenChange={setFormOpen}
          meeting={editing}
          onSaved={() => void load()}
        />
      ) : null}

      <ConfirmDialog
        open={pendingDeletion !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeletion(null);
        }}
        title="Excluir culto"
        description={
          <>
            O culto de <strong>{formatDateTime(pendingDeletion?.date)}</strong> será removido
            permanentemente. As presenças registradas neste culto também serão apagadas.
          </>
        }
        confirmLabel="Excluir"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}
