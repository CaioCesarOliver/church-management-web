"use client";

import { PageHeader } from "@/components/page-header";
import { PositionsTab } from "@/components/settings/positions-tab";
import { P, can } from "@/lib/permissions";
import { useAuth } from "@/lib/auth-context";

export default function PositionsTabSettingsPage() {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <PageHeader title="Cargos" description="Posições ministeriais atribuíveis a um membro" />
      <PositionsTab readOnly={!can(user, P.settingsManage)} />
    </div>
  );
}
