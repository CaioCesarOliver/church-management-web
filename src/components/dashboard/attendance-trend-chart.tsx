"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatPercent, formatShortDate } from "@/lib/format";
import type { AttendanceTrendPoint } from "@/types/api";

const chartConfig = {
  present: {
    label: "Presentes",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface AttendanceTrendChartProps {
  /** Already ordered oldest -> newest by the API. */
  data: AttendanceTrendPoint[];
}

export function AttendanceTrendChart({ data }: AttendanceTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assiduidade ao longo do tempo</CardTitle>
        <CardDescription>Presença nos últimos cultos</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Ainda não há cultos registrados para exibir o gráfico.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
            <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
              <defs>
                <linearGradient id="fillPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-present)" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="var(--color-present)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={16}
                tickFormatter={(value: string) => formatShortDate(value)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={32}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(_label, items) => {
                      const point = items?.[0]?.payload as AttendanceTrendPoint | undefined;
                      if (!point) return null;
                      return (
                        <span className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1.5">
                            {/* The colour is congregation data, so it is applied
                                inline instead of through a theme token. */}
                            <span
                              aria-hidden="true"
                              className="size-2 shrink-0 rounded-full"
                              style={{ backgroundColor: point.type.color ?? "var(--chart-1)" }}
                            />
                            {formatShortDate(point.date)} · {point.type.name}
                          </span>
                          <span className="font-normal text-muted-foreground">
                            {formatPercent(point.attendanceRate)} dos membros ativos
                          </span>
                        </span>
                      );
                    }}
                  />
                }
              />
              <Area
                dataKey="totalPresent"
                name="present"
                type="monotone"
                stroke="var(--color-present)"
                strokeWidth={2}
                fill="url(#fillPresent)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
