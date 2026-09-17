import type { AbsenceReason, MemberStatus, UserRole } from "@/types/api";

/**
 * The API speaks English enums; the UI speaks Portuguese. Every pt-BR label the
 * app renders for an enum value comes from here, so there is a single place to
 * translate — and a single place to add a second language later.
 *
 * Meeting types and referral sources are NOT here: they stopped being enums and
 * are now data each congregation owns, so their names come from the API.
 */

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
};

export const MEMBER_STATUS_OPTIONS = (
  Object.keys(MEMBER_STATUS_LABELS) as MemberStatus[]
).map((value) => ({ value, label: MEMBER_STATUS_LABELS[value] }));

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrador",
  SECRETARY: "Secretário(a)",
  PASTOR: "Pastor(a)",
};

/**
 * SUPER_ADMIN is deliberately absent: it is granted across congregations, not
 * picked in the per-congregation user form these options feed.
 */
export const USER_ROLE_OPTIONS = (Object.keys(USER_ROLE_LABELS) as UserRole[])
  .filter((value) => value !== "SUPER_ADMIN")
  .map((value) => ({
    value,
    label: USER_ROLE_LABELS[value],
  }));

export const USER_ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  SUPER_ADMIN: "Acesso a todas as congregações, com troca entre elas.",
  ADMIN: "Acesso total, incluindo usuários e dados da congregação.",
  SECRETARY: "Cadastra membros, visitantes, cultos e faz a chamada.",
  PASTOR: "Somente leitura: acompanha métricas e alertas de ausência.",
};

export const ABSENCE_REASON_LABELS: Record<AbsenceReason, string> = {
  NO_ATTENDANCE_IN_PERIOD: "Sem presença no período",
  CONSECUTIVE_MISSES: "Faltas consecutivas",
};

/**
 * NOTE — `PASTOR` is currently an alias for `ADMIN` everywhere.
 *
 * Modelling "pastor" as an access level was a mistake: it is a ministerial
 * POSITION, not a permission tier. Two people can both be pastors and need
 * different system access, and an administrator may hold no ministerial position
 * at all. When the cargos ministeriais feature lands, `PASTOR` leaves `UserRole`
 * and becomes a position attached to a Member, and the roles collapse to
 * SUPER_ADMIN / ADMIN / SECRETARY. Until then it simply grants ADMIN rights.
 */

/** Roles allowed to create/edit/delete operational records. */
export function canWrite(role: UserRole | undefined): boolean {
  return (
    role === "SUPER_ADMIN" || role === "ADMIN" || role === "SECRETARY" || role === "PASTOR"
  );
}

/** Roles allowed to change users and congregation settings. */
export function canManageSettings(role: UserRole | undefined): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "PASTOR";
}

/** Roles allowed to OPEN the settings area. */
export function canViewSettings(role: UserRole | undefined): boolean {
  return canManageSettings(role);
}
