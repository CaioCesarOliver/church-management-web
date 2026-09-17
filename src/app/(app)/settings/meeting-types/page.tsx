"use client";

import { MeetingTypesTab } from "@/components/settings/meeting-types-tab";
import { useAuth } from "@/lib/auth-context";
import { canManageSettings } from "@/lib/labels";

export default function MeetingTypesSettingsPage() {
  const { user } = useAuth();
  return <MeetingTypesTab readOnly={!canManageSettings(user?.role)} />;
}
