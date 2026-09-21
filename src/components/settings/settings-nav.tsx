import {
  Boxes,
  Building2,
  BadgeCheck,
  CalendarCog,
  Compass,
  KeyRound,
  Network,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { P } from "@/lib/permissions";
import type { Permission } from "@/types/api";

export interface SettingsNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface SettingsNavGroup {
  label: string;
  icon: LucideIcon;
  /** Quem enxerga o grupo. Um grupo sem permissão nenhuma some inteiro. */
  permission?: Permission;
  /** Gestão cross-tenant: capacidade de plataforma, não permissão marcável. */
  superAdminOnly?: boolean;
  items: SettingsNavItem[];
}

/**
 * A navegação de configurações — hoje DENTRO da sidebar, como submenus.
 *
 * Isto já foi seis abas numa tela só, e depois uma coluna de navegação dentro
 * de `/settings`. As duas formas tinham o mesmo defeito: a área cresce, e tanto
 * a fileira de abas quanto a coluna interna viram um depósito onde nada tem
 * hierarquia. Com o submenu na sidebar, cada seção é um destino de primeira
 * classe — aparece junto de Membros e Cultos, não escondida atrás de um clique.
 *
 * A divisão em DOIS grupos não é estética: é a mesma fronteira de permissão que
 * a API usa. Parametrizar a congregação (`settings:*`) e decidir quem entra
 * (`users:*`) são autorizações diferentes, e agora o menu mostra isso — quem só
 * administra acessos não vê a parte de parametrização, e vice-versa.
 *
 * "Minha conta" saiu daqui de propósito e foi para o menu do usuário, no
 * rodapé: trocar a própria senha não é configurar a congregação, e é onde
 * qualquer pessoa procuraria.
 */
export const SETTINGS_NAV: SettingsNavGroup[] = [
  {
    label: "Configurações",
    icon: Settings,
    permission: P.settingsView,
    items: [
      { href: "/settings/congregation", label: "Congregação", icon: Building2 },
      { href: "/settings/meeting-types", label: "Tipos de culto", icon: CalendarCog },
      { href: "/settings/positions", label: "Cargos", icon: BadgeCheck },
      { href: "/settings/departments", label: "Departamentos", icon: Boxes },
      { href: "/settings/referral-sources", label: "Origens de visitante", icon: Compass },
    ],
  },
  {
    label: "Acessos",
    icon: ShieldCheck,
    permission: P.usersView,
    items: [
      { href: "/settings/users", label: "Usuários", icon: Users },
      { href: "/settings/roles", label: "Níveis de acesso", icon: KeyRound },
    ],
  },
  {
    label: "Sistema",
    icon: Network,
    superAdminOnly: true,
    items: [{ href: "/settings/congregations", label: "Congregações", icon: Network }],
  },
];

/** Todos os destinos, achatados — usado pelo breadcrumb para achar o rótulo. */
export const SETTINGS_ITEMS: SettingsNavItem[] = SETTINGS_NAV.flatMap((group) => group.items);
