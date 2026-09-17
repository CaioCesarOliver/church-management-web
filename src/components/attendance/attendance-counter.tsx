"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatNumber, formatPercent } from "@/lib/format";
import type { MeetingAttendanceSummary } from "@/types/api";

interface AttendanceCounterProps {
  summary: MeetingAttendanceSummary;
}

/**
 * Stays pinned below the app header while the list scrolls — it is the number
 * the secretary looks at most. The values always come straight from the API
 * summary (every toggle returns a fresh one); recomputing them from the rows
 * would let the counter and the server drift apart.
 */
export function AttendanceCounter({ summary }: AttendanceCounterProps) {
  return (
    <Card className="bg-card/95 supports-[backdrop-filter]:bg-card/80 sticky top-16 z-10 py-4 shadow-sm backdrop-blur">
      <CardContent className="space-y-3 px-4">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span
            className="text-4xl leading-none font-semibold tabular-nums"
            aria-live="polite"
            aria-atomic="true"
          >
            {formatNumber(summary.totalPresent)}
          </span>
          <span className="text-muted-foreground text-sm">
            de {formatNumber(summary.eligibleMembers)} membros
          </span>
          <span className="ml-auto text-sm font-medium tabular-nums">
            {formatPercent(summary.attendanceRate)}
          </span>
        </div>

        <Progress
          value={Math.min(100, Math.round(summary.attendanceRate * 100))}
          aria-label="Percentual de presença dos membros"
        />

        <p className="text-muted-foreground text-xs">
          {formatNumber(summary.presentMembers)} membros ·{" "}
          {formatNumber(summary.presentVisitors)} visitantes
        </p>
      </CardContent>
    </Card>
  );
}
