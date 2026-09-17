"use client";

import { endOfDay, format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsDesktop } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

/**
 * The project's date field.
 *
 * Two decisions worth knowing about:
 *
 * 1. It speaks `YYYY-MM-DD` strings, not `Date`, because that is what the API
 *    contract uses for date-only fields. Conversion happens in LOCAL time on
 *    purpose — `new Date("2026-09-17")` parses as UTC midnight, which in Brazil
 *    (UTC−3) is the 16th, and `toISOString().slice(0,10)` shifts it back again.
 *    That round trip is how date pickers silently lose a day.
 *
 * 2. On a phone it opens as a drawer instead of a popover — it slides up from
 *    the bottom and can be dismissed by dragging. A popover anchored to an input
 *    near the bottom of a small screen ends up half off-screen or hidden behind
 *    the keyboard.
 */

/** `YYYY-MM-DD` → a Date at local noon (noon dodges every DST edge case). */
function parseDateOnly(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/** Date → `YYYY-MM-DD`, read from the LOCAL calendar fields. */
function formatDateOnly(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export interface DatePickerProps {
  /** `YYYY-MM-DD`, or null when empty. */
  value: string | null;
  onChange: (value: string | null) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Offer a button to clear the selection. Default: true. */
  clearable?: boolean;
  /**
   * Which dates may be picked. `past` suits birth and baptism dates, `future`
   * suits scheduling, `any` is the default.
   */
  bounds?: "any" | "past" | "future";
  /** First year offered in the dropdown. Default: 100 years back. */
  fromYear?: number;
  /** Last year offered. Default: 5 years ahead. */
  toYear?: number;
  /**
   * Earliest / latest selectable date, as `YYYY-MM-DD`. Meant for a De/Até pair
   * constraining each other — the native `<input type="date">` gave this through
   * `min`/`max`, and losing it is how a range ends up inverted.
   */
  min?: string | null;
  max?: string | null;
  className?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

export function DatePicker({
  value,
  onChange,
  id,
  placeholder = "Selecione uma data",
  disabled = false,
  clearable = true,
  bounds = "any",
  fromYear,
  toYear,
  min,
  max,
  className,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const isDesktop = useIsDesktop();

  const selected = parseDateOnly(value);
  const currentYear = new Date().getFullYear();
  const startMonth = new Date(fromYear ?? currentYear - 100, 0);
  const endMonth = new Date(toYear ?? currentYear + 5, 11);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minDate = parseDateOnly(min);
  const maxDate = parseDateOnly(max);

  function isDisabledDate(date: Date): boolean {
    if (bounds === "past" && date > today) return true;
    if (bounds === "future" && date < today) return true;
    // Compared at local noon like `parseDateOnly` produces, so the boundary days
    // themselves stay selectable.
    if (minDate && date < startOfDay(minDate)) return true;
    if (maxDate && date > endOfDay(maxDate)) return true;
    return false;
  }

  function handleSelect(date: Date | undefined) {
    onChange(date ? formatDateOnly(date) : null);
    setOpen(false);
  }

  const calendar = (
    <Calendar
      mode="single"
      selected={selected}
      onSelect={handleSelect}
      // `dropdown` gives month and year selects in the header — without them,
      // reaching a 1962 birth date means clicking "previous" 700 times.
      captionLayout="dropdown"
      startMonth={startMonth}
      endMonth={endMonth}
      defaultMonth={selected ?? (bounds === "past" ? today : undefined)}
      disabled={isDisabledDate}
      locale={ptBR}
      autoFocus
      className="mx-auto"
    />
  );

  const trigger = (
    <Button
      id={id}
      type="button"
      variant="outline"
      disabled={disabled}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      className={cn(
        "w-full justify-start gap-2 text-left font-normal",
        !selected && "text-muted-foreground",
        className,
      )}
    >
      <CalendarIcon className="size-4 shrink-0 opacity-70" aria-hidden="true" />
      <span className="truncate">
        {selected ? format(selected, "dd/MM/yyyy", { locale: ptBR }) : placeholder}
      </span>
    </Button>
  );

  const clearButton =
    clearable && selected && !disabled ? (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Limpar data"
        onClick={() => onChange(null)}
        className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
      >
        <X className="size-3.5" />
      </Button>
    ) : null;

  return (
    <div className="relative">
      {isDesktop ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            {calendar}
          </PopoverContent>
        </Popover>
      ) : (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>{trigger}</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="pb-2">
              <DrawerTitle>{placeholder}</DrawerTitle>
            </DrawerHeader>
            <div className="flex justify-center px-4 pb-6">{calendar}</div>
          </DrawerContent>
        </Drawer>
      )}

      {clearButton}
    </div>
  );
}

export interface DateTimePickerProps {
  /** Full ISO datetime in UTC — what the API stores. Null when empty. */
  value: string | null;
  onChange: (value: string | null) => void;
  id?: string;
  disabled?: boolean;
  fromYear?: number;
  toYear?: number;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

/**
 * Date plus time, for meetings.
 *
 * The API stores UTC; people think in local time. Every conversion here goes
 * through the Date constructor's LOCAL fields rather than string surgery on the
 * ISO value, which is what keeps a meeting entered as "19:30" from being read
 * back as "16:30".
 */
export function DateTimePicker({
  value,
  onChange,
  id,
  disabled = false,
  fromYear,
  toYear,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: DateTimePickerProps) {
  const current = value ? new Date(value) : null;
  const hasValidValue = current !== null && !Number.isNaN(current.getTime());

  const datePart = hasValidValue ? formatDateOnly(current) : null;
  const timePart = hasValidValue
    ? `${String(current.getHours()).padStart(2, "0")}:${String(current.getMinutes()).padStart(2, "0")}`
    : "";

  function emit(nextDate: string | null, nextTime: string) {
    if (!nextDate) {
      onChange(null);
      return;
    }

    // A date with no time yet defaults to 19:30 — the usual hour of an evening
    // service, and a far better guess than midnight.
    const [hours, minutes] = (nextTime || "19:30").split(":").map(Number);
    const [year, month, day] = nextDate.split("-").map(Number);

    onChange(new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0).toISOString());
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <div className="min-w-0 flex-1">
        <DatePicker
          id={id}
          value={datePart}
          onChange={(next) => emit(next, timePart)}
          disabled={disabled}
          clearable={false}
          fromYear={fromYear}
          toYear={toYear}
          placeholder="Data do culto"
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
        />
      </div>

      <Input
        type="time"
        aria-label="Horário"
        value={timePart}
        disabled={disabled || !datePart}
        onChange={(event) => emit(datePart, event.target.value)}
        className="sm:w-[120px]"
      />
    </div>
  );
}
