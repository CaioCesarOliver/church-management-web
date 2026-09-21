"use client";

import { PageHeader } from "@/components/page-header";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AccessDeniedCard } from "@/components/settings/access-denied-card";
import { CongregationsTab } from "@/components/settings/congregations-tab";
import { isSuperAdmin } from "@/lib/permissions";
import { useAuth } from "@/lib/auth-context";

export default function CongregationsSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Managing the list of congregations is a cross-tenant power. The nav hides
  // this entry for everyone else; this guard is what protects a typed URL.
  const allowed = isSuperAdmin(user);

  useEffect(() => {
    if (user && !allowed) router.replace("/settings/congregation");
  }, [user, allowed, router]);

  if (!user) return null;
  if (!allowed) return <AccessDeniedCard />;

  return (
    <div className="space-y-4">
      <PageHeader title="Congregações" description="Todas as congregações da rede" />
      <CongregationsTab activeCongregationId={user.congregation?.id ?? null} />
    </div>
  );
}
