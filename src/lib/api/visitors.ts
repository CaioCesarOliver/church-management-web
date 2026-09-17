import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost, type QueryParams } from "@/lib/api-client";
import type { ConvertVisitorResponse, MemberStatus, Paginated, Visitor } from "@/types/api";

export interface VisitorListParams extends QueryParams {
  search?: string;
  converted?: boolean;
  minVisits?: number;
  referralSourceId?: string;
  sortBy?: "name" | "createdAt" | "visitCount";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface VisitorInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  referralSourceId?: string | null;
  notes?: string | null;
}

export interface ConvertVisitorInput {
  birthDate?: string | null;
  baptismDate?: string | null;
  address?: string | null;
  notes?: string | null;
  status?: MemberStatus;
}

export function listVisitors(params?: VisitorListParams): Promise<Paginated<Visitor>> {
  return apiGetPaginated<Visitor>("/api/visitors", params);
}

export function getVisitor(id: string): Promise<Visitor> {
  return apiGet<Visitor>(`/api/visitors/${id}`);
}

export function createVisitor(input: VisitorInput): Promise<Visitor> {
  return apiPost<Visitor>("/api/visitors", input);
}

export function updateVisitor(id: string, input: Partial<VisitorInput>): Promise<Visitor> {
  return apiPatch<Visitor>(`/api/visitors/${id}`, input);
}

export function deleteVisitor(id: string): Promise<void> {
  return apiDelete(`/api/visitors/${id}`);
}

export function convertVisitor(id: string, input: ConvertVisitorInput = {}): Promise<ConvertVisitorResponse> {
  return apiPost<ConvertVisitorResponse>(`/api/visitors/${id}/convert`, input);
}
