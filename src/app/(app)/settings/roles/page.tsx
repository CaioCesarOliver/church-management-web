"use client";

import { PageHeader } from "@/components/page-header";
import { RolesTab } from "@/components/settings/roles-tab";
import { useAuth } from "@/lib/auth-context";
import { P, can } from "@/lib/permissions";

export default function RolesSettingsPage() {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <PageHeader title="Níveis de acesso" description="O que cada nível enxerga e pode alterar, tela a tela" />
      <RolesTab readOnly={!can(user, P.usersManage)} />
    </div>
  );
}
