"use client";

import Link from "next/link";
import { ClipboardCheck, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateLong, formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import type { Meeting, PaginationMeta } from "@/types/api";

/** `formatDateLong` yields "sábado, 13 de setembro de 2026"; the row only needs the weekday. */
function weekdayOf(date: string): string {
  return formatDateLong(date).split(",")[0];
}

interface MeetingTableProps {
  meetings: Meeting[];
  canEdit: boolean;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  empty?: ReactNode;
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onEdit: (meeting: Meeting) => void;
  onDelete: (meeting: Meeting) => void;
}

export function MeetingTable({
  meetings,
  canEdit,
  loading,
  error,
  onRetry,
  empty,
  meta,
  onPageChange,
  onEdit,
  onDelete,
}: MeetingTableProps) {
  const columns: Array<DataTableColumn<Meeting>> = [
    {
      key: "date",
      header: "Data",
      width: "w-[220px]",
      className: "align-top",
      cell: (meeting) => (
        <>
          <span className="font-medium whitespace-nowrap">{formatDateTime(meeting.date)}</span>
          <span className="text-muted-foreground block text-xs capitalize">
            {weekdayOf(meeting.date)}
          </span>
        </>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      width: "w-[130px]",
      className: "align-top",
      cell: (meeting) => (
        <Badge variant="outline" className="gap-1.5">
          {/* The colour belongs to the congregation's own type, so it is the one
              thing here applied inline instead of via a token. */}
          <span
            aria-hidden="true"
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: meeting.type.color ?? "var(--chart-1)" }}
          />
          {meeting.type.name}
        </Badge>
      ),
    },
    {
      key: "description",
      header: "Descrição",
      width: "min-w-[200px]",
      hideBelow: "md",
      className: "text-muted-foreground max-w-xs align-top",
      cell: (meeting) => <span className="line-clamp-2">{meeting.description || "—"}</span>,
    },
    {
      key: "attendance",
      header: "Presenças",
      width: "w-[180px]",
      hideBelow: "sm",
      className: "align-top",
      cell: (meeting) => {
        const summary = meeting.attendanceSummary;

        return (
          <>
            <span className="font-medium tabular-nums">{formatNumber(summary.totalPresent)}</span>
            <span className="text-muted-foreground ml-1.5 text-xs tabular-nums">
              {formatPercent(summary.attendanceRate)}
            </span>
            <span className="text-muted-foreground block text-xs">
              {formatNumber(summary.presentMembers)} membros ·{" "}
              {formatNumber(summary.presentVisitors)} visitantes
            </span>
          </>
        );
      },
    },
    {
      key: "actions",
      header: <span className="sr-only">Ações</span>,
      align: "right",
      width: "w-[170px]",
      className: "align-top",
      cell: (meeting) => (
        <div className="flex items-center justify-end gap-1">
          <Button asChild size="sm">
            <Link href={`/meetings/${meeting.id}/attendance`}>
              <ClipboardCheck className="size-4" aria-hidden="true" />
              Chamada
            </Link>
          </Button>

          {canEdit ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Mais ações do culto de ${formatDateTime(meeting.date)}`}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onEdit(meeting)}>
                  <Pencil className="size-4" aria-hidden="true" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onSelect={() => onDelete(meeting)}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={meetings}
      rowKey={(meeting) => meeting.id}
      skeletonRows={6}
      loading={loading}
      error={error}
      onRetry={onRetry}
      errorTitle="Não foi possível carregar os cultos"
      empty={empty}
      meta={meta}
      onPageChange={onPageChange}
      itemLabel="cultos"
    />
  );
}
