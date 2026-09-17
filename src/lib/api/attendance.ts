import { apiGet, apiPatch, apiPut } from "@/lib/api-client";
import type { AttendanceSheet, ToggleAttendanceResponse } from "@/types/api";

export function getAttendanceSheet(
  meetingId: string,
  params?: { includeInactive?: boolean },
): Promise<AttendanceSheet> {
  return apiGet<AttendanceSheet>(`/api/meetings/${meetingId}/attendance`, params);
}

/** Single-row toggle — the fast path the checkbox calls on every click. */
export function toggleMemberAttendance(
  meetingId: string,
  memberId: string,
  present: boolean,
): Promise<ToggleAttendanceResponse> {
  return apiPatch<ToggleAttendanceResponse>(
    `/api/meetings/${meetingId}/attendance/member/${memberId}`,
    { present },
  );
}

export function toggleVisitorAttendance(
  meetingId: string,
  visitorId: string,
  present: boolean,
): Promise<ToggleAttendanceResponse> {
  return apiPatch<ToggleAttendanceResponse>(
    `/api/meetings/${meetingId}/attendance/visitor/${visitorId}`,
    { present },
  );
}

export interface BulkAttendanceEntry {
  memberId?: string;
  visitorId?: string;
  present: boolean;
}

/** Used by "marcar todos" / "limpar". Returns the full refreshed sheet. */
export function replaceAttendance(
  meetingId: string,
  entries: BulkAttendanceEntry[],
): Promise<AttendanceSheet> {
  return apiPut<AttendanceSheet>(`/api/meetings/${meetingId}/attendance`, { entries });
}
