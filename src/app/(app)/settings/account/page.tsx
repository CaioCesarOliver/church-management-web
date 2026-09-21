"use client";

import { PageHeader } from "@/components/page-header";
import { AccountTab } from "@/components/settings/account-tab";
import { useAuth } from "@/lib/auth-context";

export default function AccountSettingsPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="space-y-4">
      <PageHeader title="Minha conta" description="Seu nome e sua senha" />
      <AccountTab user={user} />
    </div>
  );
}
