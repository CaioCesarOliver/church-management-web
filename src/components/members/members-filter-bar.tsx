"use client";

import { TriangleAlert } from "lucide-react";

import { SearchInput } from "@/components/search-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MEMBER_STATUS_OPTIONS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import {
  ALL_STATUS,
  MEMBER_SORT_OPTIONS,
  type MemberSort,
  type StatusFilter,
} from "@/components/members/member-filters";

interface MembersFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  onlyAbsenceAlert: boolean;
  onOnlyAbsenceAlertChange: (value: boolean) => void;
  sort: MemberSort;
  onSortChange: (value: MemberSort) => void;
}

export function MembersFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  onlyAbsenceAlert,
  onOnlyAbsenceAlertChange,
  sort,
  onSortChange,
}: MembersFilterBarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Buscar por nome, telefone ou e-mail"
          className="sm:max-w-sm"
        />

        <div className="flex flex-col gap-3 sm:ml-auto sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Label htmlFor="member-status-filter" className="sr-only">
              Status
            </Label>
            <Select
              value={status}
              onValueChange={(value) => onStatusChange(value as StatusFilter)}
            >
              <SelectTrigger
                id="member-status-filter"
                aria-label="Filtrar por status"
                className="w-full sm:w-[150px]"
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUS}>Todos</SelectItem>
                {MEMBER_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="member-sort" className="sr-only">
              Ordenação
            </Label>
            <Select value={sort} onValueChange={(value) => onSortChange(value as MemberSort)}>
              <SelectTrigger
                id="member-sort"
                aria-label="Ordenar membros"
                className="w-full sm:w-[180px]"
              >
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                {MEMBER_SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* The pastoral entry point into this screen: keep it visible, not tucked into a menu. */}
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors",
          onlyAbsenceAlert
            ? "border-destructive/50 bg-destructive/10"
            : "border-dashed bg-card",
        )}
      >
        <Label
          htmlFor="member-absence-alert-filter"
          className={cn(
            "cursor-pointer gap-2 text-sm",
            onlyAbsenceAlert ? "text-destructive" : "text-foreground",
          )}
        >
          <TriangleAlert
            className={cn(
              "size-4 shrink-0",
              onlyAbsenceAlert ? "text-destructive" : "text-muted-foreground",
            )}
            aria-hidden="true"
          />
          Somente em alerta de ausência
        </Label>
        <Switch
          id="member-absence-alert-filter"
          checked={onlyAbsenceAlert}
          onCheckedChange={onOnlyAbsenceAlertChange}
          aria-label="Mostrar somente membros em alerta de ausência"
        />
      </div>
    </div>
  );
}
