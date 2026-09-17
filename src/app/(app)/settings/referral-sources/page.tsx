"use client";

import { ReferralSourcesTab } from "@/components/settings/referral-sources-tab";
import { useAuth } from "@/lib/auth-context";
import { canManageSettings } from "@/lib/labels";

export default function ReferralSourcesSettingsPage() {
  const { user } = useAuth();
  return <ReferralSourcesTab readOnly={!canManageSettings(user?.role)} />;
}
