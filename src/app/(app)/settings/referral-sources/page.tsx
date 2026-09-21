"use client";

import { PageHeader } from "@/components/page-header";
import { ReferralSourcesTab } from "@/components/settings/referral-sources-tab";
import { P, can } from "@/lib/permissions";
import { useAuth } from "@/lib/auth-context";

export default function ReferralSourcesSettingsPage() {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <PageHeader title="Origens de visitante" description="Como alguém pode ter conhecido a congregação" />
      <ReferralSourcesTab readOnly={!can(user, P.settingsManage)} />
    </div>
  );
}
