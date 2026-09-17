import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost, type QueryParams } from "@/lib/api-client";
import type { Member, MemberDetail, MemberStatus, Paginated } from "@/types/api";

export interface MemberListParams extends QueryParams {
  search?: string;
  status?: MemberStatus | "";
  inAbsenceAlert?: boolean;
  sortBy?: "name" | "createdAt" | "attendanceRate";
  sortOrder?: "asc" | "desc";
  window?: number;
  page?: number;
  pageSize?: number;
}

export interface MemberInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  birthDate?: string | null;
  baptismDate?: string | null;
  address?: string | null;
  notes?: string | null;
  status?: MemberStatus;
}

export function listMembers(params?: MemberListParams): Promise<Paginated<Member>> {
  return apiGetPaginated<Member>("/api/members", params);
}

export function getMember(id: string): Promise<MemberDetail> {
  return apiGet<MemberDetail>(`/api/members/${id}`);
}

export function createMember(input: MemberInput): Promise<Member> {
  return apiPost<Member>("/api/members", input);
}

export function updateMember(id: string, input: Partial<MemberInput>): Promise<Member> {
  return apiPatch<Member>(`/api/members/${id}`, input);
}

export function deleteMember(id: string): Promise<void> {
  return apiDelete(`/api/members/${id}`);
}
