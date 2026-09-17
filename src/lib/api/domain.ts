import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api-client";
import type { MeetingType, ReferralSource } from "@/types/api";

/**
 * Congregation-owned vocabularies. These lists are small by nature — one
 * congregation's kinds of gathering — so they are fetched whole, without
 * pagination, and cached by whoever needs them.
 */

export interface MeetingTypeInput {
  name: string;
  color?: string | null;
  sortOrder?: number;
  active?: boolean;
}

export function listMeetingTypes(params?: { includeInactive?: boolean }): Promise<MeetingType[]> {
  return apiGet<MeetingType[]>("/api/meeting-types", params);
}

export function createMeetingType(input: MeetingTypeInput): Promise<MeetingType> {
  return apiPost<MeetingType>("/api/meeting-types", input);
}

export function updateMeetingType(
  id: string,
  input: Partial<MeetingTypeInput>,
): Promise<MeetingType> {
  return apiPatch<MeetingType>(`/api/meeting-types/${id}`, input);
}

export function deleteMeetingType(id: string): Promise<void> {
  return apiDelete(`/api/meeting-types/${id}`);
}

/**
 * Persists a whole new order in one request. The server derives `sortOrder` from
 * the array index, so it must receive EVERY type — a partial list is rejected
 * rather than guessed at. Returns the list already reordered.
 */
export function reorderMeetingTypes(orderedIds: string[]): Promise<MeetingType[]> {
  return apiPut<MeetingType[]>("/api/meeting-types/order", { orderedIds });
}

export interface ReferralSourceInput {
  name: string;
  sortOrder?: number;
  active?: boolean;
}

export function listReferralSources(params?: {
  includeInactive?: boolean;
}): Promise<ReferralSource[]> {
  return apiGet<ReferralSource[]>("/api/referral-sources", params);
}

export function createReferralSource(input: ReferralSourceInput): Promise<ReferralSource> {
  return apiPost<ReferralSource>("/api/referral-sources", input);
}

export function updateReferralSource(
  id: string,
  input: Partial<ReferralSourceInput>,
): Promise<ReferralSource> {
  return apiPatch<ReferralSource>(`/api/referral-sources/${id}`, input);
}

export function deleteReferralSource(id: string): Promise<void> {
  return apiDelete(`/api/referral-sources/${id}`);
}
