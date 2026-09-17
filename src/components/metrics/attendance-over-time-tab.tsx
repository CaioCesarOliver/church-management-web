"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, subMonths } from "date-fns";
import { CalendarRange } from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

import { DatePicker } from "@/components/date-picker";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { ChartTabSkeleton } from "@/components/metrics/metrics-skeletons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMeetingTypes } from "@/hooks/use-meeting-types";
import { getAttendanceOverTime } from "@/lib/api/metrics";
import { formatNumber, formatPercent } from "@/lib/format";
import type { AttendanceOverTimePoint } from "@/types/api";

type GroupBy = "meeting" | "week" | "month";

/** Radix Select has no empty-string item, so "all" stands in for "no filter". */
const ALL_TYPES = "all";

const GROUP_BY_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "meeting", label: "Por culto" },
  { value: "week", label: "Semanal" },
  { value: "month", label: "Mensal" },
];

/** Matches the API default range, so the first render asks for what it would send anyway. */
function defaultRange() {
  const today = new Date();
  return {
    from: format(subMonths(today, 6), "yyyy-MM-dd"),
    to: format(today, "yyyy-MM-dd"),
  };
}

const chartConfig = {
  members: { label: "Membros", color: "var(--chart-1)" },
  visitors: { label: "Visitantes", color: "var(--chart-2)" },
  attendanceRate: { label: "Taxa de presença", color: "var(--chart-5)" },
} satisfies ChartConfig;

interface Summary {
  meetings: number;
  average: number;
  best: AttendanceOverTimePoint;
  worst: AttendanceOverTimePoint;
}

function summarise(points: AttendanceOverTimePoint[]): Summary | null {
  if (points.length === 0) return null;

  let meetings = 0;
  let present = 0;
  let best = points[0];
  let worst = points[0];

  for (const point of points) {
    meetings += point.meetings;
    present += point.totalPresent;
    if (point.totalPresent > best.totalPresent) best = point;
    if (point.totalPresent < worst.totalPresent) worst = point;
  }

  return { meetings, average: meetings > 0 ? present / meetings : 0, best, worst };
}

export function AttendanceOverTimeTab() {
  const { items: meetingTypes, loading: loadingTypes } = useMeetingTypes();
  const [groupBy, setGroupBy] = useState<GroupBy>("meeting");
  const [meetingTypeId, setMeetingTypeId] = useState<string>(ALL_TYPES);
  const [range, setRange] = useState(defaultRange);
  const [data, setData] = useState<AttendanceOverTimePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const invalidRange = Boolean(range.from && range.to && range.from > range.to);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(
        await getAttendanceOverTime({
          from: range.from,
          to: range.to,
          groupBy,
          meetingTypeId: meetingTypeId === ALL_TYPES ? undefined : meetingTypeId,
        }),
      );
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [groupBy, meetingTypeId, range.from, range.to]);

  useEffect(() => {
    if (invalidRange) return;
    void load();
  }, [load, invalidRange]);

  const summary = useMemo(() => summarise(data), [data]);
  const periodLabel = groupBy === "meeting" ? "culto" : "período";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="metrics-group-by">Agrupamento</Label>
          <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupBy)}>
            <SelectTrigger id="metrics-group-by" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GROUP_BY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="metrics-meeting-type">Tipo de culto</Label>
          {loadingTypes ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <Select
              value={meetingTypeId}
              onValueChange={setMeetingTypeId}
              disabled={meetingTypes.length === 0}
            >
              <SelectTrigger id="metrics-meeting-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_TYPES}>Todos</SelectItem>
                {meetingTypes.map((meetingType) => (
                  <SelectItem key={meetingType.id} value={meetingType.id}>
                    <span className="flex items-center gap-2">
                      {/* Congregation data, not chrome — applied inline on purpose. */}
                      <span
                        aria-hidden="true"
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: meetingType.color ?? "var(--chart-1)" }}
                      />
                      {meetingType.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="metrics-from">De</Label>
          <DatePicker
            id="metrics-from"
            value={range.from || null}
            onChange={(from) => setRange((current) => ({ ...current, from: from ?? "" }))}
            max={range.to || null}
            placeholder="Início"
            aria-invalid={invalidRange}
            aria-describedby={invalidRange ? "metrics-range-error" : undefined}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="metrics-to">Até</Label>
          <DatePicker
            id="metrics-to"
            value={range.to || null}
            onChange={(to) => setRange((current) => ({ ...current, to: to ?? "" }))}
            min={range.from || null}
            placeholder="Fim"
            aria-invalid={invalidRange}
            aria-describedby={invalidRange ? "metrics-range-error" : undefined}
          />
        </div>
      </div>

      {invalidRange ? (
        <p id="metrics-range-error" className="text-sm text-destructive">
          A data inicial precisa ser anterior à data final.
        </p>
      ) : loading ? (
        <ChartTabSkeleton />
      ) : error ? (
        <Card>
          <CardContent>
            <ErrorState
              error={error}
              onRetry={() => void load()}
              title="Não foi possível carregar a assiduidade"
            />
          </CardContent>
        </Card>
      ) : data.length === 0 || !summary ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={CalendarRange}
              title="Nenhum culto no período selecionado"
              description="Amplie o intervalo de datas ou registre cultos para acompanhar a assiduidade."
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Assiduidade ao longo do tempo</CardTitle>
            <CardDescription>
              Presentes por {periodLabel} e taxa de presença sobre os membros ativos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ChartContainer config={chartConfig} className="aspect-auto h-[320px] w-full">
              <ComposedChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={16}
                />
                <YAxis
                  yAxisId="people"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={36}
                  allowDecimals={false}
                />
                <YAxis
                  yAxisId="rate"
                  orientation="right"
                  domain={[0, 1]}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={44}
                  tickFormatter={(value: number) => formatPercent(value)}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(value, name) => {
                        const key = String(name);
                        const entry = chartConfig[key as keyof typeof chartConfig];
                        const numeric = Number(value);
                        return (
                          <>
                            <div
                              className="size-2.5 shrink-0 rounded-[2px]"
                              style={{ backgroundColor: `var(--color-${key})` }}
                            />
                            <div className="flex flex-1 items-center justify-between gap-3 leading-none">
                              <span className="text-muted-foreground">{entry?.label ?? key}</span>
                              <span className="font-mono font-medium text-foreground tabular-nums">
                                {key === "attendanceRate"
                                  ? formatPercent(numeric)
                                  : formatNumber(numeric)}
                              </span>
                            </div>
                          </>
                        );
                      }}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  yAxisId="people"
                  dataKey="members"
                  name="members"
                  stackId="attendance"
                  fill="var(--color-members)"
                  radius={[0, 0, 4, 4]}
                />
                <Bar
                  yAxisId="people"
                  dataKey="visitors"
                  name="visitors"
                  stackId="attendance"
                  fill="var(--color-visitors)"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="rate"
                  dataKey="attendanceRate"
                  name="attendanceRate"
                  type="monotone"
                  stroke="var(--color-attendanceRate)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ChartContainer>

            <dl className="grid gap-4 border-t pt-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <dt className="text-xs text-muted-foreground">Cultos no período</dt>
                <dd className="text-xl font-semibold tabular-nums">
                  {formatNumber(summary.meetings)}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs text-muted-foreground">Média de presentes</dt>
                <dd className="text-xl font-semibold tabular-nums">
                  {formatNumber(summary.average, 1)}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs text-muted-foreground">Melhor {periodLabel}</dt>
                <dd className="text-xl font-semibold tabular-nums">
                  {formatNumber(summary.best.totalPresent)}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    em {summary.best.label}
                  </span>
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs text-muted-foreground">Pior {periodLabel}</dt>
                <dd className="text-xl font-semibold tabular-nums">
                  {formatNumber(summary.worst.totalPresent)}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    em {summary.worst.label}
                  </span>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
