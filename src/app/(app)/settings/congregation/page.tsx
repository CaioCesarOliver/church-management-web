"use client";

import { CongregationTab } from "@/components/settings/congregation-tab";
import { useAuth } from "@/lib/auth-context";
import { canManageSettings } from "@/lib/labels";

export default function CongregationSettingsPage() {
  const { user } = useAuth();
  return <CongregationTab readOnly={!canManageSettings(user?.role)} />;
}
