"use client";

import type { ComponentProps } from "react";
import { CalendarDays, ChartColumn, LayoutDashboard, UserPlus, Users } from "lucide-react";

import { CongregationSwitcher } from "@/components/congregation-switcher";
import { NavMain, type NavItem } from "@/components/nav-main";
import { NavSettings } from "@/components/nav-settings";
import { NavUser } from "@/components/nav-user";
import { P } from "@/lib/permissions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
} from "@/components/ui/sidebar";

const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, permission: P.dashboardView },
  { title: "Cultos", url: "/meetings", icon: CalendarDays, permission: P.meetingsView },
  { title: "Membros", url: "/members", icon: Users, permission: P.membersView },
  { title: "Visitantes", url: "/visitors", icon: UserPlus, permission: P.visitorsView },
  { title: "Métricas", url: "/metrics", icon: ChartColumn, permission: P.metricsView },
];

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <CongregationSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {/* UM grupo só, como no bloco sidebar-07 do shadcn: itens simples e
            colapsáveis convivem no mesmo SidebarMenu. Dois <SidebarGroup>
            empilhados somam o p-2 de cada um e abrem um vão de 16px que parece
            desalinhamento — o grupo existe para separar seções com rótulo, e
            aqui é tudo a mesma navegação. */}
        <SidebarGroup>
          <SidebarMenu>
            <NavMain items={NAV_ITEMS} />
            <NavSettings />
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
