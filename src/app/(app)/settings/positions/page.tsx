"use client";

import { PositionsTab } from "@/components/settings/positions-tab";
import { useAuth } from "@/lib/auth-context";
import { canManageSettings } from "@/lib/labels";

export default function PositionsTabSettingsPage() {
  const { user } = useAuth();
  return <PositionsTab readOnly={!canManageSettings(user?.role)} />;
}
