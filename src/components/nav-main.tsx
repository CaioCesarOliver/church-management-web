"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/lib/auth-context";
import { can } from "@/lib/permissions";
import type { NavItem } from "@/components/nav-items";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Filtrado aqui, e não em quem chama: o menu é o único lugar que decide o que
  // aparece, então a regra fica onde se olha quando algo some sem explicação.
  const visible = items.filter((item) => can(user, item.permission));

  // Devolve só os ITENS, sem <SidebarGroup> nem <SidebarMenu> em volta: quem
  // monta o grupo é a sidebar, e um grupo por componente criaria um respiro de
  // 16px (p-2 de cada) entre blocos que são a mesma lista.
  return (
    <>
      {visible.map((item) => {
          // "/" would prefix-match every route, so the Dashboard entry is exact.
          const isActive = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);

          return (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </>
  );
}
