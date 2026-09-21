"use client";

import { PageHeader } from "@/components/page-header";
import { DepartmentsTab } from "@/components/settings/departments-tab";
import { P, can } from "@/lib/permissions";
import { useAuth } from "@/lib/auth-context";

export default function DepartmentsTabSettingsPage() {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <PageHeader title="Departamentos" description="As frentes em que os membros servem, e quem lidera cada uma" />
      <DepartmentsTab readOnly={!can(user, P.settingsManage)} />
    </div>
  );
}
