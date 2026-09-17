"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";

import { DataPagination } from "@/components/data-pagination";
import { ErrorState } from "@/components/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { PaginationMeta } from "@/types/api";

/**
 * The project's standard table.
 *
 * Every list screen needs the same four states — loading, error, empty, data —
 * plus pagination and sorting. Rebuilding that per screen is how six tables end
 * up looking like six different products, so it lives here once.
 *
 * Columns are declared as data rather than as JSX so a screen describes WHAT it
 * shows and this component decides HOW: alignment, truncation, which columns
 * survive a narrow viewport, and where the sort affordance goes.
 */

export type SortOrder = "asc" | "desc";

export interface DataTableColumn<T> {
  /** Stable id. Doubles as the sort key sent back to `onSortChange`. */
  key: string;
  header: ReactNode;
  /** `index` is the row's position in the rendered page — a ranking needs it. */
  cell: (row: T, index: number) => ReactNode;
  align?: "left" | "center" | "right";
  /** Fixed width, e.g. "w-[120px]". */
  width?: string;
  className?: string;
  /** Renders a clickable, `aria-sort`-annotated header. */
  sortable?: boolean;
  /**
   * Drop the column below this breakpoint instead of letting the table scroll.
   * Reach for it on secondary columns so the primary ones stay readable on a
   * phone — the roll call is used standing up, on a phone, mid-service.
   */
  hideBelow?: "sm" | "md" | "lg";
}

interface DataTableProps<T> {
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  rowKey: (row: T) => string;

  loading?: boolean;
  /** Rows drawn while loading, so the layout does not jump when data lands. */
  skeletonRows?: number;
  error?: unknown;
  onRetry?: () => void;
  errorTitle?: string;
  /** Shown when there is no error and no rows — pass an `<EmptyState>`. */
  empty?: ReactNode;

  sort?: { key: string; order: SortOrder };
  onSortChange?: (key: string) => void;

  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  itemLabel?: string;

  onRowClick?: (row: T) => void;
  /** Extra classes per row, e.g. to tint a row in an alert state. */
  rowClassName?: (row: T) => string | undefined;
  /** Applied to the `<table>` itself — e.g. `min-w-[560px]` to force a scroll. */
  tableClassName?: string;
  /** Wraps the table in a Card. Off when the caller supplies its own shell. */
  bare?: boolean;
}

const HIDE_BELOW_CLASS = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
} as const;

const ALIGN_CLASS = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

function SortIcon({ active, order }: { active: boolean; order: SortOrder }) {
  if (!active) {
    return <ChevronsUpDown className="size-3.5 opacity-50" aria-hidden="true" />;
  }
  return order === "asc" ? (
    <ArrowUp className="size-3.5" aria-hidden="true" />
  ) : (
    <ArrowDown className="size-3.5" aria-hidden="true" />
  );
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  skeletonRows = 5,
  error,
  onRetry,
  errorTitle,
  empty,
  sort,
  onSortChange,
  meta,
  onPageChange,
  itemLabel,
  onRowClick,
  rowClassName,
  tableClassName,
  bare = false,
}: DataTableProps<T>) {
  const body = (() => {
    if (error) {
      return <ErrorState error={error} onRetry={onRetry} title={errorTitle} />;
    }
    if (!loading && rows.length === 0 && empty) {
      return empty;
    }

    return (
      <>
        {/* Only this wrapper scrolls, so a wide table never pushes the page
            sideways on a phone. */}
        <div className="w-full overflow-x-auto">
          <Table className={tableClassName}>
            <TableHeader>
              <TableRow>
                {columns.map((column) => {
                  const isSorted = sort?.key === column.key;
                  const ariaSort = !column.sortable
                    ? undefined
                    : isSorted
                      ? sort.order === "asc"
                        ? "ascending"
                        : "descending"
                      : "none";

                  return (
                    <TableHead
                      key={column.key}
                      aria-sort={ariaSort}
                      className={cn(
                        column.width,
                        column.align && ALIGN_CLASS[column.align],
                        column.hideBelow && HIDE_BELOW_CLASS[column.hideBelow],
                      )}
                    >
                      {column.sortable && onSortChange ? (
                        <button
                          type="button"
                          onClick={() => onSortChange(column.key)}
                          className={cn(
                            "-mx-2 inline-flex items-center gap-1.5 rounded-sm px-2 py-1",
                            "hover:text-foreground focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:outline-none",
                            isSorted && "text-foreground",
                          )}
                        >
                          {column.header}
                          <SortIcon active={isSorted} order={sort?.order ?? "asc"} />
                        </button>
                      ) : (
                        column.header
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading
                ? Array.from({ length: skeletonRows }, (_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      {columns.map((column) => (
                        <TableCell
                          key={column.key}
                          className={cn(column.hideBelow && HIDE_BELOW_CLASS[column.hideBelow])}
                        >
                          <Skeleton className="h-4 w-full max-w-[160px]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : rows.map((row, rowIndex) => (
                    <TableRow
                      key={rowKey(row)}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={cn(
                        onRowClick && "hover:bg-muted/50 cursor-pointer",
                        rowClassName?.(row),
                      )}
                    >
                      {columns.map((column) => (
                        <TableCell
                          key={column.key}
                          className={cn(
                            column.align && ALIGN_CLASS[column.align],
                            column.hideBelow && HIDE_BELOW_CLASS[column.hideBelow],
                            column.className,
                          )}
                        >
                          {column.cell(row, rowIndex)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>

        {meta && onPageChange && !loading ? (
          <div className="px-4 pb-1 sm:px-6">
            <DataPagination meta={meta} onPageChange={onPageChange} itemLabel={itemLabel} />
          </div>
        ) : null}
      </>
    );
  })();

  if (bare) return body;

  return (
    <Card className="overflow-hidden py-0">
      <CardContent className="p-0">{body}</CardContent>
    </Card>
  );
}
