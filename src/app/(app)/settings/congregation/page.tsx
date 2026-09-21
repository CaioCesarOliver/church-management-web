"use client";

import { PageHeader } from "@/components/page-header";
import { CongregationTab } from "@/components/settings/congregation-tab";
import { P, can } from "@/lib/permissions";
import { useAuth } from "@/lib/auth-context";

export default function CongregationSettingsPage() {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <PageHeader title="Congregação" description="Dados de contato e as regras de assiduidade usadas nos alertas" />
      <CongregationTab readOnly={!can(user, P.settingsManage)} />
    </div>
  );
}
