"use client";

import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { SearchInput } from "@/components/search-input";
import { UserFormDialog } from "@/components/settings/user-form-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { deleteUser, listUsers } from "@/lib/api/settings";
import { useAuth } from "@/lib/auth-context";
import { formatDate, initials } from "@/lib/format";
import { USER_ROLE_LABELS, USER_ROLE_OPTIONS } from "@/lib/labels";
import type { PaginationMeta, SystemUser, UserRole } from "@/types/api";

const ALL = "all";
const PAGE_SIZE = 20;

const EMPTY_META: PaginationMeta = { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 0 };

const ROLE_BADGE_VARIANT: Record<UserRole, "default" | "secondary" | "outline"> = {
  SUPER_ADMIN: "default",
  ADMIN: "default",
  SECRETARY: "secondary",
  PASTOR: "outline",
};

interface UsersTabProps {
  /** The signed-in user — they may not delete their own account. */
  currentUserId: string;
  isSuperAdmin: boolean;
  /** PASTOR sees the list but gets no create / edit / delete controls. */
  readOnly?: boolean;
}

export function UsersTab({ currentUserId, isSuperAdmin, readOnly = false }: UsersTabProps) {
  const { user: signedInUser } = useAuth();
  // The API scopes this list to the congregation in the token, which is invisible
  // on screen — a SUPER_ADMIN who just switched would otherwise read another
  // congregation's users as their own.
  const congregationName = signedInUser?.congregation?.name ?? null;

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const [role, setRole] = useState<string>(ALL);
  const [activeFilter, setActiveFilter] = useState<string>(ALL);
  const [page, setPage] = useState(1);

  const [users, setUsers] = useState<SystemUser[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SystemUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SystemUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listUsers({
        search: debouncedSearch.trim() || undefined,
        role: role === ALL ? undefined : (role as UserRole),
        active: activeFilter === ALL ? undefined : activeFilter === "true",
        page,
        pageSize: PAGE_SIZE,
      });
      setUsers(result.items);
      setMeta(result.meta);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, role, activeFilter, page]);

  // A narrowed filter can leave the current page past the end of the result set.
  // Adjusting during render (instead of in an effect) keeps `load` from firing
  // once with the stale page and again with page 1.
  const filtersKey = `${debouncedSearch}|${role}|${activeFilter}`;
  const [appliedFiltersKey, setAppliedFiltersKey] = useState(filtersKey);
  if (appliedFiltersKey !== filtersKey) {
    setAppliedFiltersKey(filtersKey);
    setPage(1);
  }

  useEffect(() => {
    void load();
  }, [load]);

  const hasFilters = debouncedSearch.trim() !== "" || role !== ALL || activeFilter !== ALL;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(user: SystemUser) {
    setEditing(user);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget.id);
      toast.success("Usuário removido.");
      setDeleteTarget(null);
      // Removing the only row of the last page would otherwise leave it blank.
      if (users.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await load();
      }
    } catch (err) {
      // 409 covers "last active administrator" and self-deletion; the API message
      // already explains which, in pt-BR.
      toast.error(err instanceof Error ? err.message : "Não foi possível remover o usuário.");
    }
  }

  const columns: Array<DataTableColumn<SystemUser>> = [
    {
      key: "name",
      header: "Nome",
      cell: (user) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium whitespace-nowrap">
            {user.name}
            {user.id === currentUserId ? (
              <span className="text-muted-foreground ml-1.5 text-xs font-normal">(você)</span>
            ) : null}
          </span>
        </div>
      ),
    },
    {
      key: "email",
      header: "E-mail",
      hideBelow: "lg",
      className: "text-muted-foreground",
      cell: (user) => user.email,
    },
    {
      key: "role",
      header: "Cargo",
      cell: (user) => (
        <Badge variant={ROLE_BADGE_VARIANT[user.role]}>{USER_ROLE_LABELS[user.role]}</Badge>
      ),
    },
    {
      key: "active",
      header: "Situação",
      hideBelow: "sm",
      cell: (user) => (
        <span className="flex items-center gap-1.5 text-sm whitespace-nowrap">
          <span
            aria-hidden="true"
            className={
              user.active
                ? "bg-primary size-1.5 rounded-full"
                : "bg-muted-foreground size-1.5 rounded-full"
            }
          />
          {user.active ? "Ativo" : "Inativo"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Criado em",
      hideBelow: "md",
      className: "text-muted-foreground whitespace-nowrap tabular-nums",
      cell: (user) => formatDate(user.createdAt),
    },
  ];

  if (!readOnly) {
    columns.push({
      key: "actions",
      header: <span className="sr-only">Ações</span>,
      align: "right",
      cell: (user) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Editar ${user.name}`}
            onClick={() => openEdit(user)}
          >
            <Pencil className="size-4" />
          </Button>
          {/* Deleting yourself is a guaranteed 409 — do not offer it. */}
          {user.id === currentUserId ? null : (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remover ${user.name}`}
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteTarget(user)}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      ),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nome ou e-mail"
          />

          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por cargo">
              <SelectValue placeholder="Cargo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os cargos</SelectItem>
              {USER_ROLE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
              {/* Only reachable when a SUPER_ADMIN exists in the congregation. */}
              {isSuperAdmin ? (
                <SelectItem value="SUPER_ADMIN">{USER_ROLE_LABELS.SUPER_ADMIN}</SelectItem>
              ) : null}
            </SelectContent>
          </Select>

          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger className="w-full sm:w-40" aria-label="Filtrar por situação">
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas as situações</SelectItem>
              <SelectItem value="true">Ativos</SelectItem>
              <SelectItem value="false">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {readOnly ? null : (
          <Button onClick={openCreate} className="w-full sm:w-auto">
            <Plus className="size-4" />
            Novo usuário
          </Button>
        )}
      </div>

      {congregationName ? (
        <p className="text-muted-foreground text-sm">
          Usuários de <span className="text-foreground font-medium">{congregationName}</span>.
        </p>
      ) : null}

      <DataTable
        columns={columns}
        rows={users}
        rowKey={(user) => user.id}
        loading={loading}
        error={error}
        onRetry={() => void load()}
        errorTitle="Não foi possível carregar os usuários"
        empty={
          <EmptyState
            icon={Users}
            title={hasFilters ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
            description={
              hasFilters
                ? "Ajuste a busca ou os filtros para encontrar quem você procura."
                : "Cadastre o primeiro acesso ao sistema para a sua equipe."
            }
          >
            {hasFilters ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setRole(ALL);
                  setActiveFilter(ALL);
                }}
              >
                Limpar filtros
              </Button>
            ) : readOnly ? null : (
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                Novo usuário
              </Button>
            )}
          </EmptyState>
        }
        meta={meta}
        onPageChange={setPage}
        itemLabel="usuários"
      />

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        canGrantSuperAdmin={isSuperAdmin}
        onSaved={() => void load()}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Remover usuário"
        description={
          <>
            <strong className="text-foreground">{deleteTarget?.name}</strong> perderá o acesso ao
            sistema. Esta ação não pode ser desfeita.
          </>
        }
        confirmLabel="Remover"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
