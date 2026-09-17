import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
  storeSession,
  type QueryParams,
} from "@/lib/api-client";
import type {
  AuthUser,
  Congregation,
  CongregationDetail,
  LoginResponse,
  Paginated,
  SystemUser,
  UserRole,
} from "@/types/api";

export interface UserListParams extends QueryParams {
  search?: string;
  role?: UserRole | "";
  active?: boolean;
  page?: number;
  pageSize?: number;
}

export interface UserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  /**
   * SUPER_ADMIN only: creates the user inside another congregation instead of
   * the active one. Required while the caller has no active congregation — the
   * first-run setup relies on it.
   */
  congregationId?: string;
}

export function listUsers(params?: UserListParams): Promise<Paginated<SystemUser>> {
  return apiGetPaginated<SystemUser>("/api/users", params);
}

export function createUser(input: UserInput): Promise<SystemUser> {
  return apiPost<SystemUser>("/api/users", input);
}

export function updateUser(
  id: string,
  input: Partial<UserInput> & { active?: boolean },
): Promise<SystemUser> {
  return apiPatch<SystemUser>(`/api/users/${id}`, input);
}

export function deleteUser(id: string): Promise<void> {
  return apiDelete(`/api/users/${id}`);
}

/** Powers the congregation switcher in the sidebar. */
export function listCongregations(): Promise<Congregation[]> {
  return apiGet<Congregation[]>("/api/congregations");
}

export function createCongregation(input: {
  name: string;
  slug: string;
}): Promise<Congregation> {
  return apiPost<Congregation>("/api/congregations", input);
}

export function updateCongregation(
  id: string,
  input: { name?: string; slug?: string; active?: boolean },
): Promise<Congregation> {
  return apiPatch<Congregation>(`/api/congregations/${id}`, input);
}

export function deleteCongregation(id: string): Promise<void> {
  return apiDelete(`/api/congregations/${id}`);
}

/**
 * Re-scopes the session to another congregation and persists the new token, so
 * every later request is already tenant-correct. Works even when the caller has
 * no active congregation yet, which is how the first-run setup gets in.
 *
 * Callers are expected to full-reload afterwards: screens already on the page
 * hold data fetched with the previous token.
 */
export async function switchCongregation(congregationId: string): Promise<AuthUser> {
  const result = await apiPost<LoginResponse>("/api/auth/switch-congregation", {
    congregationId,
  });
  storeSession(result.token, result.user);
  return result.user;
}

export function getCurrentCongregation(): Promise<CongregationDetail> {
  return apiGet<CongregationDetail>("/api/congregations/current");
}

export function updateCurrentCongregation(input: {
  name?: string;
  slug?: string;
}): Promise<CongregationDetail> {
  return apiPatch<CongregationDetail>("/api/congregations/current", input);
}
