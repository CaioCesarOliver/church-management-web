"use client";

import { Plus, SearchX, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import type { SortOrder } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConvertVisitorDialog } from "@/components/visitors/convert-visitor-dialog";
import { VisitorFormDialog } from "@/components/visitors/visitor-form-dialog";
import { VisitorsTable } from "@/components/visitors/visitors-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useReferralSources } from "@/hooks/use-referral-sources";
import { deleteVisitor, listVisitors, type VisitorListParams } from "@/lib/api/visitors";
import { useAuth } from "@/lib/auth-context";
import { formatNumber } from "@/lib/format";
import { canWrite } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Paginated, Visitor } from "@/types/api";

type ConvertedFilter = "all" | "pending" | "converted";
type SortKey = "recent" | "name" | "visits";

/** Radix Select has no empty-string item, so "all" stands in for "no filter". */
const ALL_SOURCES = "all";

const CONVERTED_OPTIONS: Array<{ value: ConvertedFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Ainda não convertidos" },
  { value: "converted", label: "Já convertidos" },
];

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "recent", label: "Mais recentes" },
  { value: "name", label: "Nome" },
  { value: "visits", label: "Mais visitas" },
];

/** `sortOrder` is the direction each field starts in; the header click flips it. */
const SORT_PARAMS: Record<SortKey, Required<Pick<VisitorListParams, "sortBy" | "sortOrder">>> = {
  recent: { sortBy: "createdAt", sortOrder: "desc" },
  name: { sortBy: "name", sortOrder: "asc" },
  visits: { sortBy: "visitCount", sortOrder: "desc" },
};

/** Table column keys arrive as plain strings; only some of them are sort keys. */
function isSortKey(value: string): value is SortKey {
  return value in SORT_PARAMS;
}

const CONVERTED_PARAM: Record<ConvertedFilter, boolean | undefined> = {
  all: undefined,
  pending: false,
  converted: true,
};

function deleteWarning(visitor: Visitor): string {
  const count = visitor.stats.visitCount;
  const history =
    count === 0
      ? `O cadastro de ${visitor.name} será apagado definitivamente`
      : count === 1
        ? `O cadastro de ${visitor.name} e a presença registrada como visitante serão apagados definitivamente`
        : `O cadastro de ${visitor.name} e as ${formatNumber(count)} presenças registradas como visitante serão apagados definitivamente`;
  return `${history}. Esta ação não pode ser desfeita.`;
}

export default function VisitorsPage() {
  const { user } = useAuth();
  const writable = canWrite(user?.role);
  const { items: referralSources, loading: loadingSources } = useReferralSources();

  const [search, setSearch] = useState("");
  const [convertedFilter, setConvertedFilter] = useState<ConvertedFilter>("all");
  const [referralSourceId, setReferralSourceId] = useState(ALL_SOURCES);
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [sortOrder, setSortOrder] = useState<SortOrder>(SORT_PARAMS.recent.sortOrder);
  const [minVisits, setMinVisits] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search);
  const debouncedMinVisits = useDebouncedValue(minVisits);

  const [data, setData] = useState<Paginated<Visitor> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Visitor | null>(null);
  const [converting, setConverting] = useState<Visitor | null>(null);
  const [convertOpen, setConvertOpen] = useState(false);
  const [deleting, setDeleting] = useState<Visitor | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const parsedMinVisits = Number.parseInt(debouncedMinVisits, 10);
  const minVisitsParam =
    Number.isFinite(parsedMinVisits) && parsedMinVisits > 0 ? parsedMinVisits : undefined;

  const hasFilters =
    search.trim().length > 0 ||
    convertedFilter !== "all" ||
    referralSourceId !== ALL_SOURCES ||
    minVisits.trim().length > 0;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listVisitors({
        search: debouncedSearch.trim() || undefined,
        converted: CONVERTED_PARAM[convertedFilter],
        referralSourceId: referralSourceId === ALL_SOURCES ? undefined : referralSourceId,
        minVisits: minVisitsParam,
        page,
        sortBy: SORT_PARAMS[sortKey].sortBy,
        sortOrder,
      });
      setData(result);
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [
    convertedFilter,
    debouncedSearch,
    minVisitsParam,
    page,
    referralSourceId,
    sortKey,
    sortOrder,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  function clearFilters() {
    setSearch("");
    setConvertedFilter("all");
    setReferralSourceId(ALL_SOURCES);
    setMinVisits("");
    setPage(1);
  }

  /** The select picks the field and its natural direction. */
  function changeSort(value: SortKey) {
    setSortKey(value);
    setSortOrder(SORT_PARAMS[value].sortOrder);
    setPage(1);
  }

  /**
   * Header clicks and the "Ordenar por" select drive the same state, so they cannot
   * disagree: clicking another column is exactly picking it in the select, and
   * clicking the column already sorted only flips the direction.
   */
  function toggleSort(key: string) {
    if (!isSortKey(key)) return;
    if (key === sortKey) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      setPage(1);
      return;
    }
    changeSort(key);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(visitor: Visitor) {
    setEditing(visitor);
    setFormOpen(true);
  }

  function openConvert(visitor: Visitor) {
    setConverting(visitor);
    setConvertOpen(true);
  }

  function openDelete(visitor: Visitor) {
    setDeleting(visitor);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteVisitor(deleting.id);
      toast.success(`${deleting.name} foi removido dos visitantes.`);
      // Removing the last row of a page would leave it empty — step back one.
      if ((data?.items.length ?? 0) === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await load();
      }
    } catch {
      toast.error("Não foi possível excluir o visitante.");
    }
  }

  const items = data?.items ?? [];
  const showSkeleton = loading && data === null;
  const createButton = writable ? (
    <Button onClick={openCreate}>
      <Plus className="size-4" aria-hidden="true" />
      Novo visitante
    </Button>
  ) : null;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Visitantes"
        description="Quem visitou a congregação e ainda não é membro"
      >
        {createButton}
      </PageHeader>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Buscar por nome, telefone ou e-mail"
          className="lg:max-w-xs"
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="visitors-converted-filter" className="text-muted-foreground text-xs">
              Situação
            </Label>
            <Select
              value={convertedFilter}
              onValueChange={(value) => {
                setConvertedFilter(value as ConvertedFilter);
                setPage(1);
              }}
            >
              <SelectTrigger id="visitors-converted-filter" className="w-full lg:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONVERTED_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="visitors-referral-filter" className="text-muted-foreground text-xs">
              Como conheceu
            </Label>
            {loadingSources ? (
              <Skeleton className="h-9 w-full lg:w-52" />
            ) : (
              <Select
                value={referralSourceId}
                onValueChange={(value) => {
                  setReferralSourceId(value);
                  setPage(1);
                }}
                disabled={referralSources.length === 0}
              >
                <SelectTrigger id="visitors-referral-filter" className="w-full lg:w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_SOURCES}>Todas as origens</SelectItem>
                  {referralSources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="visitors-sort" className="text-muted-foreground text-xs">
              Ordenar por
            </Label>
            <Select
              value={sortKey}
              onValueChange={(value) => {
                if (isSortKey(value)) changeSort(value);
              }}
            >
              <SelectTrigger id="visitors-sort" className="w-full lg:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="visitors-min-visits" className="text-muted-foreground text-xs">
              Mínimo de visitas
            </Label>
            <Input
              id="visitors-min-visits"
              type="number"
              min={0}
              inputMode="numeric"
              value={minVisits}
              onChange={(event) => {
                setMinVisits(event.target.value);
                setPage(1);
              }}
              placeholder="0"
              className="w-full lg:w-32"
            />
          </div>
        </div>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        {/* A refetch over rows already on screen dims them instead of replacing
            the whole table with a skeleton. */}
        <div
          className={cn(
            "transition-opacity",
            loading && !showSkeleton && "pointer-events-none opacity-60",
          )}
          aria-busy={loading}
        >
          <VisitorsTable
            visitors={items}
            writable={writable}
            loading={showSkeleton}
            error={error}
            onRetry={() => void load()}
            empty={
              hasFilters ? (
                <EmptyState
                  icon={SearchX}
                  title="Nenhum visitante encontrado"
                  description="Nenhum registro corresponde aos filtros aplicados. Ajuste a busca ou limpe os filtros."
                >
                  <Button variant="outline" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                </EmptyState>
              ) : (
                <EmptyState
                  icon={UserPlus}
                  title="Nenhum visitante registrado"
                  description="Visitantes também podem ser cadastrados direto na tela de chamada."
                >
                  {createButton}
                </EmptyState>
              )
            }
            meta={data?.meta}
            onPageChange={setPage}
            sort={{ key: sortKey, order: sortOrder }}
            onSortChange={toggleSort}
            onEdit={openEdit}
            onDelete={openDelete}
            onConvert={openConvert}
          />
        </div>
      </Card>

      <VisitorFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        visitor={editing}
        onSaved={() => void load()}
      />

      <ConvertVisitorDialog
        open={convertOpen}
        onOpenChange={setConvertOpen}
        visitor={converting}
        onConverted={() => void load()}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir visitante"
        description={deleting ? deleteWarning(deleting) : ""}
        confirmLabel="Excluir"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}
