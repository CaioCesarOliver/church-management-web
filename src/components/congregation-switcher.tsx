"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";

import { BrandLogo } from "@/components/brand-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { listCongregations, switchCongregation } from "@/lib/api/settings";
import { useAuth } from "@/lib/auth-context";
import type { Congregation } from "@/types/api";

export function CongregationSwitcher() {
  const { isMobile } = useSidebar();
  const { user } = useAuth();
  const [congregations, setCongregations] = useState<Congregation[]>([]);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listCongregations()
      .then((items) => {
        if (!cancelled) setCongregations(items);
      })
      // A failure here must not break the shell: the switcher simply stays
      // single-congregation, which is the correct view for most installs.
      .catch(() => {
        if (!cancelled) setCongregations([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // A SUPER_ADMIN on a brand-new installation has no active congregation yet;
  // the app layout routes them to /setup, so there is nothing to label here.
  if (!user || !user.congregation) return null;

  const active = user.congregation;
  // Super admin não tem nível de congregação: o nível é sempre DE uma
  // congregação, e ele não pertence a nenhuma.
  const roleLabel = user.superAdmin ? "Super admin" : (user.role?.name ?? "Sem nível");
  const canSwitch = congregations.length > 1;

  async function handleSwitch(congregationId: string) {
    if (congregationId === active.id || switching) return;
    setSwitching(true);
    try {
      await switchCongregation(congregationId);
      // Every screen holds tenant-scoped data fetched with the previous token.
      // A full reload is the honest way to refetch all of it at once.
      window.location.reload();
    } catch (error) {
      setSwitching(false);
      toast.error(
        error instanceof Error ? error.message : "Não foi possível trocar de congregação.",
      );
    }
  }

  const label = (
    <>
      <BrandLogo size={32} />
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{active.name}</span>
        <span className="truncate text-xs text-muted-foreground">{roleLabel}</span>
      </div>
    </>
  );

  // A single-congregation install gets a plain header — no chevron, no dead menu.
  if (!canSwitch) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent active:bg-transparent">
            {label}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              disabled={switching}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {label}
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Congregações
            </DropdownMenuLabel>
            {congregations.map((congregation) => (
              <DropdownMenuItem
                key={congregation.id}
                className="gap-2 p-2"
                onSelect={() => handleSwitch(congregation.id)}
              >
                <span className="flex-1 truncate">{congregation.name}</span>
                {congregation.id === active.id ? <Check className="size-4 text-primary" /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
