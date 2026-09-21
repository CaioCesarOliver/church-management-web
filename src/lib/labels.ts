import type { AbsenceReason, MemberStatus } from "@/types/api";

/**
 * The API speaks English enums; the UI speaks Portuguese. Every pt-BR label the
 * app renders for an enum value comes from here, so there is a single place to
 * translate — and a single place to add a second language later.
 *
 * Meeting types and referral sources are NOT here: they stopped being enums and
 * are now data each congregation owns, so their names come from the API.
 *
 * Os NÍVEIS DE ACESSO também saíram daqui pelo mesmo motivo: deixaram de ser um
 * enum traduzível e viraram dado da congregação, com nome escolhido por quem
 * administra. Quem decide o que a tela mostra agora é `lib/permissions.ts`.
 */

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
};

export const MEMBER_STATUS_OPTIONS = (
  Object.keys(MEMBER_STATUS_LABELS) as MemberStatus[]
).map((value) => ({ value, label: MEMBER_STATUS_LABELS[value] }));

export const ABSENCE_REASON_LABELS: Record<AbsenceReason, string> = {
  NO_ATTENDANCE_IN_PERIOD: "Sem presença no período",
  CONSECUTIVE_MISSES: "Faltas consecutivas",
};


