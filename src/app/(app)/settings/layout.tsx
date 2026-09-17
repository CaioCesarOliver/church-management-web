"use client";

import type { ReactNode } from "react";

import { PageHeader } from "@/components/page-header";
import { AccessDeniedCard } from "@/components/settings/access-denied-card";
import { SettingsNav } from "@/components/settings/settings-nav";
import { useAuth } from "@/lib/auth-context";
import { canManageSettings, canViewSettings } from "@/lib/labels";

/**
 * Shell for every settings section.
 *
 * These used to be six tabs in one screen. Nested routes give each section a
 * real URL — so it is linkable, the back button works and the breadcrumb can say
 * where you are — and they let the navigation be grouped instead of a single row
 * that overflows a phone.
 */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (!canViewSettings(user?.role) || !user) {
    return (
      <div className="space-y-4">
        <PageHeader title="Configurações" />
        <AccessDeniedCard />
      </div>
    );
  }

  // PASTOR may open this area but change nothing except its own account: the API
  // grants it read access to users and congregation data, so blocking the screen
  // outright hid information the pastoral office is entitled to see.
  const readOnly = !canManageSettings(user.role);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Configurações"
        description="Dados da congregação, listas próprias, usuários e a sua conta"
      />

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <SettingsNav isSuperAdmin={user.role === "SUPER_ADMIN"} />

        <div className="min-w-0 space-y-4">
          {readOnly ? (
            <p className="text-muted-foreground rounded-md border border-dashed px-3 py-2 text-sm">
              Você tem acesso somente de leitura a esta área — exceto por Minha conta.
            </p>
          ) : null}

          {children}
        </div>
      </div>
    </div>
  );
}
