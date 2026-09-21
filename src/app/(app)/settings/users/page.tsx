"use client";

import { PageHeader } from "@/components/page-header";
import { UsersTab } from "@/components/settings/users-tab";
import { P, can, isSuperAdmin } from "@/lib/permissions";
import { useAuth } from "@/lib/auth-context";

export default function UsersSettingsPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="space-y-4">
      <PageHeader title="Usuários" description="Quem tem login nesta congregação" />
      <UsersTab
        currentUserId={user.id}
        isSuperAdmin={isSuperAdmin(user)}
        readOnly={!can(user, P.usersManage)}
      />
    </div>
  );
}
