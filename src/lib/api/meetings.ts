import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost, type QueryParams } from "@/lib/api-client";
import type { Meeting, Paginated } from "@/types/api";

export interface MeetingListParams extends QueryParams {
  meetingTypeId?: string;
  from?: string;
  to?: string;
  search?: string;
  sortBy?: "date" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface MeetingInput {
  meetingTypeId: string;
  /** ISO datetime. */
  date: string;
  description?: string | null;
}

export function listMeetings(params?: MeetingListParams): Promise<Paginated<Meeting>> {
  return apiGetPaginated<Meeting>("/api/meetings", params);
}

export function getMeeting(id: string): Promise<Meeting> {
  return apiGet<Meeting>(`/api/meetings/${id}`);
}

export function createMeeting(input: MeetingInput): Promise<Meeting> {
  return apiPost<Meeting>("/api/meetings", input);
}

export function updateMeeting(id: string, input: Partial<MeetingInput>): Promise<Meeting> {
  return apiPatch<Meeting>(`/api/meetings/${id}`, input);
}

export function deleteMeeting(id: string): Promise<void> {
  return apiDelete(`/api/meetings/${id}`);
}
