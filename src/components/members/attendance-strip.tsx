"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MemberAttendanceEntry } from "@/types/api";

interface AttendanceStripProps {
  entries: MemberAttendanceEntry[];
}

/** One square per recent meeting: filled = presente, vazio = ausente. */
export function AttendanceStrip({ entries }: AttendanceStripProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum culto registrado ainda para este membro.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {entries.map((entry) => (
          <Tooltip key={entry.meetingId}>
            <TooltipTrigger asChild>
              <span
                tabIndex={0}
                aria-label={`${formatDate(entry.date)} · ${entry.type.name} · ${
                  entry.present ? "presente" : "ausente"
                }`}
                className={cn(
                  "size-6 rounded-sm border transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                  entry.present ? "border-primary bg-primary" : "border-border bg-muted",
                )}
              />
            </TooltipTrigger>
            <TooltipContent side="top">
              <span className="flex flex-col gap-0.5">
                <span>
                  {formatDate(entry.date)} · {entry.type.name}
                </span>
                <span className="opacity-80">{entry.present ? "Presente" : "Ausente"}</span>
              </span>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-[3px] border border-primary bg-primary" aria-hidden="true" />
          Presente
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-[3px] border border-border bg-muted" aria-hidden="true" />
          Ausente
        </span>
      </div>
    </div>
  );
}
