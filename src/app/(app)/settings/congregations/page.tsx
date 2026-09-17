"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AccessDeniedCard } from "@/components/settings/access-denied-card";
import { CongregationsTab } from "@/components/settings/congregations-tab";
import { useAuth } from "@/lib/auth-context";

export default function CongregationsSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Managing the list of congregations is a cross-tenant power. The nav hides
  // this entry for everyone else; this guard is what protects a typed URL.
  const allowed = user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (user && !allowed) router.replace("/settings/congregation");
  }, [user, allowed, router]);

  if (!user) return null;
  if (!allowed) return <AccessDeniedCard />;

  return <CongregationsTab activeCongregationId={user.congregation?.id ?? null} />;
}
