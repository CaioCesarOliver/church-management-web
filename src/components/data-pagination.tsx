"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "@/types/api";

interface DataPaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  /** Plural noun for the counter, e.g. "membros", "cultos". */
  itemLabel?: string;
}

export function DataPagination({ meta, onPageChange, itemLabel = "registros" }: DataPaginationProps) {
  const { page, pageSize, total, totalPages } = meta;

  if (total === 0) return null;

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    // Three columns on desktop rather than `justify-between`: the controls are
    // centred against the full width of the table, not against whatever space
    // the counter leaves over — otherwise they drift as the counter's digits
    // grow. Stacked and centred on a phone.
    <div className="flex flex-col items-center gap-3 border-t pt-4 sm:grid sm:grid-cols-3 sm:items-center">
      <p className="text-muted-foreground text-sm sm:justify-self-start">
        Exibindo <span className="text-foreground font-medium">{first}</span>–
        <span className="text-foreground font-medium">{last}</span> de{" "}
        <span className="text-foreground font-medium">{total}</span> {itemLabel}
      </p>

      <div className="flex items-center gap-2 sm:justify-self-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="size-4" />
          Anterior
        </Button>
        <span className="text-muted-foreground text-sm tabular-nums">
          {page} / {Math.max(totalPages, 1)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Próxima
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Balances the grid so the middle column lands in the true centre. */}
      <span className="hidden sm:block" aria-hidden="true" />
    </div>
  );
}
