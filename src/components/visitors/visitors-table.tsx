"use client";

import { MoreHorizontal, Pencil, Trash2, UserCheck } from "lucide-react";
import type { ReactNode } from "react";

import { DataTable, type DataTableColumn, type SortOrder } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatNumber, formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PaginationMeta, Visitor } from "@/types/api";

/** Visitors at or above this many visits are flagged as conversion candidates. */
const FREQUENT_VISIT_THRESHOLD = 3;

interface VisitorsTableProps {
  visitors: Visitor[];
  writable: boolean;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  empty?: ReactNode;
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  /** Sort keys are the column keys below, which double as the screen's sort keys. */
  sort?: { key: string; order: SortOrder };
  onSortChange?: (key: string) => void;
  onEdit: (visitor: Visitor) => void;
  onDelete: (visitor: Visitor) => void;
  onConvert: (visitor: Visitor) => void;
}

export function VisitorsTable({
  visitors,
  writable,
  loading,
  error,
  onRetry,
  empty,
  meta,
  onPageChange,
  sort,
  onSortChange,
  onEdit,
  onDelete,
  onConvert,
}: VisitorsTableProps) {
  const isFrequent = (visitor: Visitor) =>
    visitor.convertedToMemberId === null &&
    visitor.stats.visitCount >= FREQUENT_VISIT_THRESHOLD;

  const columns: Array<DataTableColumn<Visitor>> = [
    {
      key: "name",
      header: "Nome",
      sortable: true,
      cell: (visitor) => (
        <div className="font-medium">
          <div className="flex flex-wrap items-center gap-2">
            <span>{visitor.name}</span>
            {isFrequent(visitor) ? (
              <Badge
                variant="secondary"
                title="Visitante recorrente — candidato natural à conversão em membro"
              >
                frequente
              </Badge>
            ) : null}
          </div>
          {/* "Como conheceu" has its own column from md up. */}
          <p className="text-muted-foreground mt-0.5 text-xs font-normal md:hidden">
            {visitor.referralSource?.name ?? "—"}
          </p>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contato",
      className: "text-sm",
      cell: (visitor) => (
        <>
          <span className="block whitespace-nowrap">{formatPhone(visitor.phone)}</span>
          {visitor.email ? (
            <span className="text-muted-foreground block text-xs break-all">{visitor.email}</span>
          ) : null}
        </>
      ),
    },
    {
      key: "referralSource",
      header: "Como conheceu",
      hideBelow: "md",
      className: "text-muted-foreground text-sm",
      cell: (visitor) => visitor.referralSource?.name ?? "—",
    },
    {
      key: "visits",
      header: "Visitas",
      align: "center",
      sortable: true,
      cell: (visitor) => (
        <span
          className={cn(
            "text-lg font-semibold tabular-nums",
            isFrequent(visitor)
              ? "text-primary"
              : visitor.stats.visitCount === 0
                ? "text-muted-foreground"
                : undefined,
          )}
        >
          {formatNumber(visitor.stats.visitCount)}
        </span>
      ),
    },
    {
      key: "lastVisit",
      header: "Última visita",
      hideBelow: "sm",
      className: "text-muted-foreground text-sm whitespace-nowrap",
      cell: (visitor) => formatDate(visitor.stats.lastVisitAt),
    },
    {
      key: "situation",
      header: "Situação",
      hideBelow: "sm",
      cell: (visitor) =>
        visitor.convertedToMemberId !== null ? (
          <div className="space-y-0.5">
            <Badge variant="outline" className="border-primary/40 text-primary">
              <UserCheck className="size-3" aria-hidden="true" />
              Convertido em membro
            </Badge>
            <p className="text-muted-foreground text-xs whitespace-nowrap">
              Convertido em {formatDate(visitor.convertedAt)}
            </p>
          </div>
        ) : (
          <Badge variant="secondary">Visitante</Badge>
        ),
    },
  ];

  if (writable) {
    columns.push({
      key: "actions",
      header: <span className="sr-only">Ações</span>,
      align: "right",
      width: "w-px",
      cell: (visitor) => (
        <div className="flex items-center justify-end gap-2">
          {visitor.convertedToMemberId === null ? (
            <Button
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
              onClick={() => onConvert(visitor)}
            >
              <UserCheck className="size-4" aria-hidden="true" />
              Converter em membro
            </Button>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Mais ações para ${visitor.name}`}>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(visitor)}>
                <Pencil className="size-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => onDelete(visitor)}>
                <Trash2 className="size-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    });
  }

  return (
    <DataTable
      bare
      columns={columns}
      rows={visitors}
      rowKey={(visitor) => visitor.id}
      skeletonRows={6}
      loading={loading}
      error={error}
      onRetry={onRetry}
      errorTitle="Não foi possível carregar os visitantes"
      empty={empty}
      sort={sort}
      onSortChange={onSortChange}
      meta={meta}
      onPageChange={onPageChange}
      itemLabel="visitantes"
    />
  );
}
