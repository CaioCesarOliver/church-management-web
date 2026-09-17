"use client";

import type { ReactNode } from "react";

import { AttendanceRow } from "@/components/attendance/attendance-row";

export interface AttendanceListItem {
  id: string;
  name: string;
  phone: string | null;
  present: boolean;
}

interface AttendanceListProps {
  items: AttendanceListItem[];
  disabled?: boolean;
  onToggle: (id: string, present: boolean) => void;
  empty: ReactNode;
}

export function AttendanceList({ items, disabled, onToggle, empty }: AttendanceListProps) {
  if (items.length === 0) return <>{empty}</>;

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <AttendanceRow
          key={item.id}
          id={item.id}
          name={item.name}
          phone={item.phone}
          present={item.present}
          disabled={disabled}
          onToggle={(present) => onToggle(item.id, present)}
        />
      ))}
    </div>
  );
}
