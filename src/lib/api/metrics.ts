import { apiGet, type QueryParams } from "@/lib/api-client";
import type {
  AbsenceAlert,
  AbsenceAlertsResponse,
  AttendanceOverTimePoint,
  AttendanceRankingRow,
  DashboardMetrics,
  MemberStatus,
} from "@/types/api";
import { API_URL, buildQuery, getStoredToken } from "@/lib/api-client";

export interface RuleParams extends QueryParams {
  window?: number;
  absenceDays?: number;
  consecutiveMeetings?: number;
}

export function getDashboard(params?: RuleParams): Promise<DashboardMetrics> {
  return apiGet<DashboardMetrics>("/api/metrics/dashboard", params);
}

export interface AttendanceRateParams extends QueryParams {
  window?: number;
  status?: MemberStatus;
  limit?: number;
  order?: "asc" | "desc";
}

export function getAttendanceRanking(params?: AttendanceRateParams): Promise<AttendanceRankingRow[]> {
  return apiGet<AttendanceRankingRow[]>("/api/metrics/attendance-rate", params);
}

export interface AttendanceOverTimeParams extends QueryParams {
  from?: string;
  to?: string;
  groupBy?: "meeting" | "week" | "month";
  meetingTypeId?: string;
}

export function getAttendanceOverTime(
  params?: AttendanceOverTimeParams,
): Promise<AttendanceOverTimePoint[]> {
  return apiGet<AttendanceOverTimePoint[]>("/api/metrics/attendance-over-time", params);
}

/**
 * `/absence-alerts` is the one metrics endpoint that returns a `meta` block
 * alongside `data`, so it is read directly instead of through `apiGet`.
 */
export async function getAbsenceAlerts(params?: {
  days?: number;
  consecutiveMeetings?: number;
}): Promise<AbsenceAlertsResponse> {
  const token = getStoredToken();
  const response = await fetch(`${API_URL}/api/metrics/absence-alerts${buildQuery(params)}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as {
    data?: AbsenceAlert[];
    meta?: AbsenceAlertsResponse["meta"];
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Não foi possível carregar os alertas de ausência.");
  }

  return {
    items: payload.data ?? [],
    meta: payload.meta ?? { days: 30, consecutiveMeetings: 3, total: payload.data?.length ?? 0 },
  };
}
