import { CalendarDays, ChartColumn, LayoutDashboard, UserPlus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { P } from "@/lib/permissions";
import type { AuthUser, Permission } from "@/types/api";
import { can } from "@/lib/permissions";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  /** Sem esta permissão o item não aparece — nem o destino é alcançável. */
  permission: Permission;
}

/**
 * Os destinos principais, na ordem em que aparecem no menu.
 *
 * A ordem também é a de FALLBACK: quem não pode ver o Dashboard cai no primeiro
 * item desta lista que lhe é permitido. Por isso a definição vive num módulo
 * próprio, e não dentro da sidebar — a tela inicial precisa dela para saber para
 * onde mandar a pessoa.
 */
export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, permission: P.dashboardView },
  { title: "Cultos", url: "/meetings", icon: CalendarDays, permission: P.meetingsView },
  { title: "Membros", url: "/members", icon: Users, permission: P.membersView },
  { title: "Visitantes", url: "/visitors", icon: UserPlus, permission: P.visitorsView },
  { title: "Métricas", url: "/metrics", icon: ChartColumn, permission: P.metricsView },
];

/**
 * A primeira tela que esta pessoa consegue abrir.
 *
 * `null` quando ela não pode abrir nenhuma — situação real, e não teórica: um
 * nível pode ter sido criado só com permissões de Configurações. Nesse caso a
 * tela inicial precisa dizer isso, e não redirecionar para lugar nenhum.
 */
export function firstAllowedPath(user: AuthUser | null | undefined): string | null {
  return NAV_ITEMS.find((item) => can(user, item.permission))?.url ?? null;
}
