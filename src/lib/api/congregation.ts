import { apiPatch } from "@/lib/api-client";
import type { CongregationDetail } from "@/types/api";

/**
 * The full write surface of `PATCH /api/congregations/current`: contact details,
 * timezone and the follow-up rules. `@/lib/api/settings` keeps its narrow
 * name/slug helper for the callers that only rename a congregation.
 */
export interface CurrentCongregationInput {
  name?: string;
  slug?: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  timezone?: string;
  logoUrl?: string | null;
  /** `null` clears the override and falls back to the installation default. */
  attendanceRateWindow?: number | null;
  absenceAlertDays?: number | null;
  absenceAlertConsecutiveMeetings?: number | null;
}

export function updateCurrentCongregationDetails(
  input: CurrentCongregationInput,
): Promise<CongregationDetail> {
  return apiPatch<CongregationDetail>("/api/congregations/current", input);
}
