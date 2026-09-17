"use client";

import { AccountTab } from "@/components/settings/account-tab";
import { useAuth } from "@/lib/auth-context";

export default function AccountSettingsPage() {
  const { user } = useAuth();
  if (!user) return null;

  return <AccountTab user={user} />;
}
