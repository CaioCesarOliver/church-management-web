import type { AuthUser, Permission } from "@/types/api";

/**
 * Quem pode o quê, do lado do cliente.
 *
 * **Isto é sobre o que a tela MOSTRA, não sobre o que o sistema PERMITE.** A
 * autorização de verdade acontece na API, em `requirePermission`. Esconder um
 * botão aqui é cortesia com quem usa — evitar oferecer o que vai dar erro — e
 * nunca uma barreira: qualquer pessoa consegue chamar a API direto.
 *
 * Por isso nenhuma verificação daqui substitui a do servidor, e por isso não há
 * problema em o front confiar na lista de permissões que veio no login.
 */

/** A pessoa tem esta permissão? */
export function can(user: AuthUser | null | undefined, permission: Permission): boolean {
  // `permissions` é conferido em vez de assumido: uma sessão guardada antes da
  // migração de permissões não tem o campo, e o app pinta a tela a partir dela
  // antes do /auth/me responder. Sem esta guarda seria um erro de execução na
  // primeira renderização, para todo usuário já logado no dia do deploy.
  if (!user?.permissions) return false;
  return user.permissions.includes(permission);
}

/** Tem ao menos uma delas. Útil para um item de menu que abre várias telas. */
export function canAny(
  user: AuthUser | null | undefined,
  ...permissions: Permission[]
): boolean {
  if (!user?.permissions) return false;
  return permissions.some((permission) => user.permissions.includes(permission));
}

/** Tem todas. Usado onde a ação toca mais de uma área — converter visitante. */
export function canAll(
  user: AuthUser | null | undefined,
  ...permissions: Permission[]
): boolean {
  if (!user?.permissions) return false;
  return permissions.every((permission) => user.permissions.includes(permission));
}

/**
 * Gestão cross-tenant de congregações.
 *
 * Função separada, e não uma permissão, porque no servidor também não é uma:
 * se fosse marcável na tela de permissionamento, quem administra usuários
 * poderia se conceder acesso a todas as congregações da rede.
 */
export function isSuperAdmin(user: AuthUser | null | undefined): boolean {
  return user?.superAdmin === true;
}

/**
 * As chaves do catálogo usadas pelo código do front.
 *
 * Existe para o TypeScript pegar um erro de digitação: `can(user, "membros:editar")`
 * compilaria e simplesmente nunca seria verdadeiro, e o sintoma — "o botão não
 * aparece" — fica longe da causa. As chaves em si continuam vindo do servidor
 * na tela de permissionamento, que desenha o catálogo inteiro sem conhecê-lo.
 */
export const P = {
  dashboardView: "dashboard:view",
  meetingsView: "meetings:view",
  meetingsManage: "meetings:manage",
  attendanceView: "attendance:view",
  attendanceManage: "attendance:manage",
  membersView: "members:view",
  membersManage: "members:manage",
  visitorsView: "visitors:view",
  visitorsManage: "visitors:manage",
  metricsView: "metrics:view",
  settingsView: "settings:view",
  settingsManage: "settings:manage",
  usersView: "users:view",
  usersManage: "users:manage",
} as const satisfies Record<string, Permission>;
