import type { LucideIcon } from "lucide-react";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SettingsStatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
}

/** Compact counter card for the congregation tab. */
export function SettingsStatCard({ title, value, icon: Icon }: SettingsStatCardProps) {
  return (
    <Card className="gap-2 py-4">
      <CardHeader className="gap-1 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
        <CardAction>
          <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        </CardAction>
      </CardHeader>
      <CardContent className="px-4">
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
