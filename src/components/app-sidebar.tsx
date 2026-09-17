"use client";

import type { ComponentProps } from "react";
import {
  CalendarDays,
  ChartColumn,
  LayoutDashboard,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";

import { CongregationSwitcher } from "@/components/congregation-switcher";
import { NavMain, type NavItem } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";
import { canViewSettings } from "@/lib/labels";

const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Cultos", url: "/meetings", icon: CalendarDays },
  { title: "Membros", url: "/members", icon: Users },
  { title: "Visitantes", url: "/visitors", icon: UserPlus },
  { title: "Métricas", url: "/metrics", icon: ChartColumn },
];

const SETTINGS_ITEM: NavItem = { title: "Configurações", url: "/settings", icon: Settings };

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const items = canViewSettings(user?.role) ? [...NAV_ITEMS, SETTINGS_ITEM] : NAV_ITEMS;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <CongregationSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
