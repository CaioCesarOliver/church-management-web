"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AttendanceRowProps {
  id: string;
  name: string;
  phone: string | null;
  present: boolean;
  disabled?: boolean;
  onToggle: (present: boolean) => void;
}

/**
 * The whole row is the tap target: a `<label>` wrapping the checkbox forwards
 * the click to it, so a finger aimed anywhere on the line marks the person
 * while the checkbox itself stays keyboard-operable.
 */
export function AttendanceRow({ id, name, phone, present, disabled, onToggle }: AttendanceRowProps) {
  const checkboxId = `attendance-row-${id}`;

  return (
    <label
      htmlFor={checkboxId}
      className={cn(
        "flex min-h-14 items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors select-none",
        present ? "border-accent bg-accent/50" : "bg-card",
        disabled ? "cursor-default" : "cursor-pointer hover:bg-accent/30 active:bg-accent",
      )}
    >
      <Checkbox
        id={checkboxId}
        checked={present}
        disabled={disabled}
        onCheckedChange={(checked) => onToggle(checked === true)}
        aria-label={`Presença de ${name}`}
        className="size-6 [&_svg]:size-4"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{name}</span>
        {phone ? (
          <span className="text-muted-foreground block truncate text-sm">{formatPhone(phone)}</span>
        ) : null}
      </span>
    </label>
  );
}
