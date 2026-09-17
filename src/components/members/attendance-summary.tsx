"use client";

import { TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatPercent } from "@/lib/format";
import { ABSENCE_REASON_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { MemberStats } from "@/types/api";

interface AbsenceAlertBadgeProps {
  reasons: MemberStats["absenceReasons"] | undefined;
  consecutiveMissed: number;
}

export function AbsenceAlertBadge({ reasons, consecutiveMissed }: AbsenceAlertBadgeProps) {
  // Defensive: one absent field should degrade this badge, not blank the whole
  // Members screen. The fallback below still explains why the member is flagged.
  const labels = (reasons ?? []).map((reason) => ABSENCE_REASON_LABELS[reason]);
  const summary = labels.length > 0 ? labels.join(" · ") : "Membro em alerta de ausência";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* A span, not a button: the row itself is the click target. tabIndex keeps
            the tooltip reachable by keyboard. */}
        <Badge
          variant="destructive"
          tabIndex={0}
          aria-label={`Em alerta de ausência: ${summary}`}
          className="gap-1"
        >
          <TriangleAlert aria-hidden="true" />
          Alerta
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top">
        <span className="flex flex-col gap-0.5">
          {labels.map((label) => (
            <span key={label}>{label}</span>
          ))}
          <span className="opacity-80">
            {consecutiveMissed === 1
              ? "1 falta consecutiva"
              : `${consecutiveMissed} faltas consecutivas`}
          </span>
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

interface AttendanceSummaryProps {
  stats: MemberStats;
  className?: string;
}

/** Rate + progress bar + "x/y cultos" — the column that makes the list worth opening. */
export function AttendanceSummary({ stats, className }: AttendanceSummaryProps) {
  const hasWindow = stats.consideredCount > 0;

  return (
    <div className={cn("w-40 space-y-1.5", className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium tabular-nums">
          {hasWindow ? formatPercent(stats.attendanceRate) : "—"}
        </span>
        {stats.inAbsenceAlert ? (
          <AbsenceAlertBadge
            reasons={stats.absenceReasons}
            consecutiveMissed={stats.consecutiveMissed}
          />
        ) : null}
      </div>

      <Progress
        value={hasWindow ? Math.round(stats.attendanceRate * 100) : 0}
        aria-label={`Assiduidade: ${hasWindow ? formatPercent(stats.attendanceRate) : "sem cultos no período"}`}
        className="h-1.5"
      />

      <p className="text-xs text-muted-foreground">
        {hasWindow
          ? `${stats.attendedCount}/${stats.consideredCount} cultos`
          : "sem cultos no período"}
      </p>
    </div>
  );
}
