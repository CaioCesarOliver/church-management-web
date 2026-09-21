"use client";

import { DepartmentsTab } from "@/components/settings/departments-tab";
import { useAuth } from "@/lib/auth-context";
import { canManageSettings } from "@/lib/labels";

export default function DepartmentsTabSettingsPage() {
  const { user } = useAuth();
  return <DepartmentsTab readOnly={!canManageSettings(user?.role)} />;
}
