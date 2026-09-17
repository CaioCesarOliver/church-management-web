"use client";

import { X } from "lucide-react";

import { DatePicker } from "@/components/date-picker";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
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

/**
 * Radix's Select refuses an empty string as an item value (it reserves it for
 * "nothing selected"), so the "all types" entry carries this sentinel and is
 * mapped back to `undefined` before the value reaches the API.
 */
export const ALL_TYPES = "ALL" as const;

export interface MeetingFiltersValue {
  search: string;
  /** A meeting type id, or `ALL_TYPES`. */
  meetingTypeId: string;
  /** YYYY-MM-DD, inclusive. */
  from: string;
  /** YYYY-MM-DD, inclusive. */
  to: string;
}

export const EMPTY_FILTERS: MeetingFiltersValue = {
  search: "",
  meetingTypeId: ALL_TYPES,
  from: "",
  to: "",
};

export function hasActiveFilters(filters: MeetingFiltersValue): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.meetingTypeId !== ALL_TYPES ||
    filters.from !== "" ||
    filters.to !== ""
  );
}

/** `"ALL"` means "no filter", not a type the API knows about. */
export function toMeetingTypeIdParam(meetingTypeId: string): string | undefined {
  return meetingTypeId === ALL_TYPES ? undefined : meetingTypeId;
}

interface MeetingFiltersProps {
  value: MeetingFiltersValue;
  onChange: (value: MeetingFiltersValue) => void;
  onClear: () => void;
}

export function MeetingFilters({ value, onChange, onClear }: MeetingFiltersProps) {
  const { items: meetingTypes, loading } = useMeetingTypes();
  const active = hasActiveFilters(value);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      {/* SearchInput labels itself with the placeholder, so a visible <Label
          htmlFor> here would point at an element with no id. */}
      <SearchInput
        value={value.search}
        onChange={(search) => onChange({ ...value, search })}
        placeholder="Buscar pela descrição"
        className="sm:w-64"
      />

      <div className="flex flex-col gap-1.5 sm:w-44">
        <Label htmlFor="meeting-type">Tipo</Label>
        {loading ? (
          <Skeleton className="h-9 w-full" />
        ) : (
          <Select
            value={value.meetingTypeId}
            onValueChange={(meetingTypeId) => onChange({ ...value, meetingTypeId })}
            disabled={meetingTypes.length === 0}
          >
            <SelectTrigger id="meeting-type" className="w-full">
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_TYPES}>Todos os tipos</SelectItem>
              {meetingTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  <span className="flex items-center gap-2">
                    {/* Congregation data, not chrome — applied inline on purpose. */}
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: type.color ?? "var(--chart-1)" }}
                    />
                    {type.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex flex-col gap-1.5 sm:w-40">
        <Label htmlFor="meeting-from">De</Label>
        <DatePicker
          id="meeting-from"
          value={value.from || null}
          onChange={(from) => onChange({ ...value, from: from ?? "" })}
          max={value.to || null}
          placeholder="Início"
        />
      </div>

      <div className="flex flex-col gap-1.5 sm:w-40">
        <Label htmlFor="meeting-to">Até</Label>
        <DatePicker
          id="meeting-to"
          value={value.to || null}
          onChange={(to) => onChange({ ...value, to: to ?? "" })}
          min={value.from || null}
          placeholder="Fim"
        />
      </div>

      {active ? (
        <Button variant="ghost" onClick={onClear} className="w-full sm:w-auto">
          <X className="size-4" aria-hidden="true" />
          Limpar filtros
        </Button>
      ) : null}
    </div>
  );
}
