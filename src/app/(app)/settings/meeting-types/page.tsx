"use client";

import { PageHeader } from "@/components/page-header";
import { MeetingTypesTab } from "@/components/settings/meeting-types-tab";
import { P, can } from "@/lib/permissions";
import { useAuth } from "@/lib/auth-context";

export default function MeetingTypesSettingsPage() {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <PageHeader title="Tipos de culto" description="As opções que aparecem ao registrar um culto" />
      <MeetingTypesTab readOnly={!can(user, P.settingsManage)} />
    </div>
  );
}
