"use client";

import { UsersTab } from "@/components/settings/users-tab";
import { useAuth } from "@/lib/auth-context";
import { canManageSettings } from "@/lib/labels";

export default function UsersSettingsPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <UsersTab
      currentUserId={user.id}
      isSuperAdmin={user.role === "SUPER_ADMIN"}
      readOnly={!canManageSettings(user.role)}
    />
  );
}
