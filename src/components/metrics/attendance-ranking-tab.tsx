"use client";

import { useCallback, useEffect, useState } from "react";
import { Users } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAttendanceRanking } from "@/lib/api/metrics";
import { formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AttendanceRankingRow } from "@/types/api";

type StatusFilter = "ACTIVE" | "ALL";
type Order = "desc" | "asc";

const WINDOW_OPTIONS = [4, 8, 12, 20];
const RANKING_LIMIT = 50;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ACTIVE", label: "Ativos" },
  { value: "ALL", label: "Todos" },
];

const ORDER_OPTIONS: { value: Order; label: string }[] = [
  { value: "desc", label: "Maior assiduidade" },
  { value: "asc", label: "Menor assiduidade" },
];

/** `DataTableColumn.cell` only sees the row, so the position becomes part of it. */
interface RankedRow extends AttendanceRankingRow {
  position: number;
}

/** Theme-token medals — gold/silver/bronze read as brand tints, not fixed colours. */
const MEDAL_CLASSES = [
  "bg-primary text-primary-foreground",
  "bg-primary/60 text-primary-foreground",
  "bg-primary/25 text-foreground",
];

/**
 * The API only ranks one status at a time (`status` defaults to ACTIVE and has no
 * "all" value), so "Todos" is assembled from both lists and re-ranked here.
 */
async function fetchRanking(
  status: StatusFilter,
  window: number,
  order: Order,
): Promise<AttendanceRankingRow[]> {
  if (status === "ACTIVE") {
    return getAttendanceRanking({ window, status: "ACTIVE", order, limit: RANKING_LIMIT });
  }

  const [active, inactive] = await Promise.all([
    getAttendanceRanking({ window, status: "ACTIVE", order, limit: RANKING_LIMIT }),
    getAttendanceRanking({ window, status: "INACTIVE", order, limit: RANKING_LIMIT }),
  ]);

  return [...active, ...inactive]
    .sort((a, b) =>
      a.attendanceRate === b.attendanceRate
        ? a.name.localeCompare(b.name, "pt-BR")
        : order === "desc"
          ? b.attendanceRate - a.attendanceRate
          : a.attendanceRate - b.attendanceRate,
    )
    .slice(0, RANKING_LIMIT);
}

export function AttendanceRankingTab() {
  const [windowSize, setWindowSize] = useState(8);
  const [status, setStatus] = useState<StatusFilter>("ACTIVE");
  const [order, setOrder] = useState<Order>("desc");
  const [rows, setRows] = useState<AttendanceRankingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchRanking(status, windowSize, order));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [status, windowSize, order]);

  useEffect(() => {
    void load();
  }, [load]);

  const highlightTop = order === "desc";
  const ranked: RankedRow[] = rows.map((row, index) => ({ ...row, position: index + 1 }));

  const columns: Array<DataTableColumn<RankedRow>> = [
    {
      key: "position",
      header: "#",
      width: "w-12",
      cell: (row) => (
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
            highlightTop && row.position <= 3
              ? MEDAL_CLASSES[row.position - 1]
              : "bg-muted text-muted-foreground",
          )}
        >
          {row.position}
        </span>
      ),
    },
    {
      key: "name",
      header: "Nome",
      className: "font-medium",
      cell: (row) => row.name,
    },
    {
      key: "attended",
      header: "Presenças",
      align: "right",
      width: "w-28",
      hideBelow: "sm",
      className: "text-muted-foreground tabular-nums",
      cell: (row) => `${formatNumber(row.attendedCount)}/${formatNumber(row.consideredCount)}`,
    },
    {
      key: "rate",
      header: "Assiduidade",
      width: "w-56",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Progress
            value={Math.round(row.attendanceRate * 100)}
            className="flex-1"
            aria-label={`Assiduidade de ${row.name}`}
          />
          <span className="w-12 shrink-0 text-right text-sm font-medium tabular-nums">
            {formatPercent(row.attendanceRate)}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="ranking-window">Janela</Label>
          <Select value={String(windowSize)} onValueChange={(value) => setWindowSize(Number(value))}>
            <SelectTrigger id="ranking-window" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WINDOW_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  Últimos {option} cultos
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ranking-status">Status</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
            <SelectTrigger id="ranking-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ranking-order">Ordem</Label>
          <Select value={order} onValueChange={(value) => setOrder(value as Order)}>
            <SelectTrigger id="ranking-order" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ranking de frequência</CardTitle>
          <CardDescription>
            Presença nos últimos {windowSize} cultos
            {status === "ACTIVE" ? " entre os membros ativos" : " entre todos os membros"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!highlightTop && ranked.length > 0 ? (
            <p className="bg-muted text-muted-foreground rounded-md px-3 py-2 text-sm">
              Esta lista existe para orientar o acompanhamento pastoral: são os irmãos que mais
              precisam de uma visita ou de um telefonema nesta semana.
            </p>
          ) : null}

          <DataTable
            bare
            columns={columns}
            rows={ranked}
            rowKey={(row) => row.memberId}
            skeletonRows={8}
            loading={loading}
            error={error}
            onRetry={() => void load()}
            errorTitle="Não foi possível carregar o ranking"
            empty={
              <EmptyState
                icon={Users}
                title="Nenhum membro para ranquear"
                description="Registre cultos e faça a chamada para que a frequência possa ser calculada."
              />
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
