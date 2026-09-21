import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type { PermissionArea, Role } from "@/types/api";

/**
 * Níveis de acesso da congregação.
 *
 * O CATÁLOGO de permissões vem do servidor e não é duplicado aqui: as telas
 * existem no código da API, e manter duas listas garantiria que uma delas ficaria
 * desatualizada. A tela de permissionamento desenha o que `listPermissionAreas`
 * devolver, sem conhecer as chaves de antemão.
 */

export function listPermissionAreas(): Promise<PermissionArea[]> {
  return apiGet<PermissionArea[]>("/api/roles/permissions");
}

export function listRoles(params?: { includeInactive?: boolean; congregationId?: string }): Promise<Role[]> {
  return apiGet<Role[]>("/api/roles", params);
}

export interface RoleInput {
  name: string;
  permissions: string[];
  active?: boolean;
}

export function createRole(input: RoleInput): Promise<Role> {
  return apiPost<Role>("/api/roles", input);
}

export function updateRole(id: string, input: Partial<RoleInput>): Promise<Role> {
  return apiPatch<Role>(`/api/roles/${id}`, input);
}

export function deleteRole(id: string): Promise<void> {
  return apiDelete(`/api/roles/${id}`);
}
