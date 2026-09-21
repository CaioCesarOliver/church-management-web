"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SETTINGS_NAV } from "@/components/settings/settings-nav";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";
import { can, isSuperAdmin } from "@/lib/permissions";

/**
 * Configurações e Acessos como submenus, e não como um link para uma tela com
 * navegação própria dentro.
 *
 * O grupo abre sozinho quando você já está numa de suas seções — voltar de uma
 * página para outra não deveria exigir reabrir o menu toda vez.
 */
export function NavSettings() {
  const { user } = useAuth();
  const pathname = usePathname();

  const groups = SETTINGS_NAV.filter((group) =>
    group.superAdminOnly ? isSuperAdmin(user) : can(user, group.permission ?? ""),
  );

  if (groups.length === 0) return null;

  // Mesma razão do NavMain: só os itens. Configurações e Acessos continuam a
  // mesma lista que Dashboard e Membros — são destinos de primeira classe, não
  // um bloco à parte no rodapé do menu.
  return (
    <>
      {groups.map((group) => {
          const isOpen = group.items.some((item) => pathname.startsWith(item.href));

          return (
            <Collapsible
              key={group.label}
              asChild
              defaultOpen={isOpen}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  {/* Sem `isActive` no pai, de propósito: o padrão do shadcn
                      destaca só o subitem aberto. Destacar os dois níveis deixa
                      o menu pesado e confunde qual é a página atual. */}
                  <SidebarMenuButton tooltip={group.label}>
                    <group.icon />
                    <span>{group.label}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarMenuSub>
                    {group.items.map((item) => (
                      <SidebarMenuSubItem key={item.href}>
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith(item.href)}>
                          <Link href={item.href}>
                            <item.icon />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        );
      })}
    </>
  );
}
