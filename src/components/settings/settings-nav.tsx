"use client";

import { Building2, CalendarCog, Compass, Network, UserCog, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SettingsNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Only a SUPER_ADMIN sees cross-tenant settings. */
  superAdminOnly?: boolean;
}

interface SettingsNavGroup {
  label: string;
  items: SettingsNavItem[];
}

/**
 * Grouped on purpose. Six flat entries tell you nothing about what KIND of
 * setting each one is; grouping answers "am I configuring the congregation, an
 * access, or the installation?" before you read a single label.
 */
export const SETTINGS_NAV: SettingsNavGroup[] = [
  {
    label: "Congregação",
    items: [
      { href: "/settings/congregation", label: "Dados gerais", icon: Building2 },
      { href: "/settings/meeting-types", label: "Tipos de culto", icon: CalendarCog },
      { href: "/settings/referral-sources", label: "Origens de visitante", icon: Compass },
    ],
  },
  {
    label: "Acessos",
    items: [
      { href: "/settings/users", label: "Usuários", icon: Users },
      { href: "/settings/account", label: "Minha conta", icon: UserCog },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/settings/congregations", label: "Congregações", icon: Network, superAdminOnly: true },
    ],
  },
];

export function SettingsNav({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  const groups = SETTINGS_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.superAdminOnly || isSuperAdmin),
  })).filter((group) => group.items.length > 0);

  const allItems = groups.flatMap((group) => group.items);
  const current = allItems.find((item) => pathname.startsWith(item.href))?.href ?? allItems[0]?.href;

  return (
    <>
      {/* Phone: a select. A horizontal strip of six tabs either overflows or
          truncates its labels, and neither tells you where you are. */}
      <div className="lg:hidden">
        <Select value={current} onValueChange={(value) => router.push(value)}>
          <SelectTrigger className="w-full" aria-label="Seção de configurações">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {groups.map((group) => (
              <SelectGroup key={group.label}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.items.map((item) => (
                  <SelectItem key={item.href} value={item.href}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      <nav className="hidden lg:block" aria-label="Configurações">
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="text-muted-foreground px-2 text-xs font-medium tracking-wide uppercase">
                {group.label}
              </p>
              {group.items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}
