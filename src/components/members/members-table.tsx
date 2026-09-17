"use client";

import { Eye, MoreHorizontal, Pencil, Trash2, UserCheck, UserMinus } from "lucide-react";
import type { ReactNode } from "react";

import { DataTable, type DataTableColumn, type SortOrder } from "@/components/data-table";
import { AttendanceSummary } from "@/components/members/attendance-summary";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatDaysAgo, formatPhone, initials } from "@/lib/format";
import { MEMBER_STATUS_LABELS } from "@/lib/labels";
import type { Member, PaginationMeta } from "@/types/api";

interface MembersTableProps {
  members: Member[];
  canWrite: boolean;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  empty?: ReactNode;
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  /** Sort keys are the column keys below, which double as `MemberSort` values. */
  sort?: { key: string; order: SortOrder };
  onSortChange?: (key: string) => void;
  onOpenDetail: (member: Member) => void;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
  onToggleStatus: (member: Member) => void;
}

export function MembersTable({
  members,
  canWrite,
  loading,
  error,
  onRetry,
  empty,
  meta,
  onPageChange,
  sort,
  onSortChange,
  onOpenDetail,
  onEdit,
  onDelete,
  onToggleStatus,
}: MembersTableProps) {
  const columns: Array<DataTableColumn<Member>> = [
    {
      key: "name",
      header: "Nome",
      sortable: true,
      width: "min-w-[200px]",
      cell: (member) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="text-xs">{initials(member.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onOpenDetail(member);
              }}
              className="focus-visible:ring-ring/50 block max-w-[220px] truncate text-left font-medium hover:underline focus-visible:ring-[3px] focus-visible:outline-none"
            >
              {member.name}
            </button>
            {member.convertedFromVisitor ? (
              <Badge variant="outline" className="text-muted-foreground text-[11px]">
                ex-visitante
              </Badge>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contato",
      width: "min-w-[180px]",
      hideBelow: "lg",
      cell: (member) => (
        <div className="space-y-0.5">
          <p className="text-sm">{formatPhone(member.phone)}</p>
          <p className="text-muted-foreground max-w-[220px] truncate text-xs">
            {member.email ?? "—"}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      hideBelow: "sm",
      cell: (member) => (
        <Badge variant={member.status === "ACTIVE" ? "default" : "secondary"}>
          {MEMBER_STATUS_LABELS[member.status]}
        </Badge>
      ),
    },
    {
      key: "attendance",
      header: "Assiduidade",
      sortable: true,
      width: "min-w-[180px]",
      cell: (member) => <AttendanceSummary stats={member.stats} />,
    },
    {
      key: "lastAttendance",
      header: "Última presença",
      width: "min-w-[150px]",
      hideBelow: "md",
      cell: (member) => (
        <div className="space-y-0.5">
          <p className="text-sm">{formatDaysAgo(member.stats.daysSinceLastAttendance)}</p>
          <p className="text-muted-foreground text-xs">
            {member.stats.lastAttendanceAt ? formatDate(member.stats.lastAttendanceAt) : "—"}
          </p>
        </div>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Ações</span>,
      align: "right",
      width: "w-10",
      cell: (member) => {
        const isActive = member.status === "ACTIVE";

        return (
          // The row opens the detail sheet; the menu must not trigger it too.
          <div onClick={(event) => event.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Ações para ${member.name}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onOpenDetail(member)}>
                  <Eye />
                  Ver detalhes
                </DropdownMenuItem>

                {canWrite ? (
                  <>
                    <DropdownMenuItem onSelect={() => onEdit(member)}>
                      <Pencil />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onToggleStatus(member)}>
                      {isActive ? <UserMinus /> : <UserCheck />}
                      {isActive ? "Marcar como inativo" : "Marcar como ativo"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => onDelete(member)}>
                      <Trash2 />
                      Excluir
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={members}
      rowKey={(member) => member.id}
      loading={loading}
      skeletonRows={8}
      error={error}
      onRetry={onRetry}
      errorTitle="Não foi possível carregar os membros"
      empty={empty}
      sort={sort}
      onSortChange={onSortChange}
      meta={meta}
      onPageChange={onPageChange}
      itemLabel="membros"
      onRowClick={onOpenDetail}
    />
  );
}
