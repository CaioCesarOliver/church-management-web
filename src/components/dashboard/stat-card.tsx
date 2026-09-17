import type { LucideIcon } from "lucide-react";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  /** Pulls the card into the destructive accent — used when absence alerts are pending. */
  highlight?: boolean;
}

export function StatCard({ title, value, hint, icon: Icon, highlight = false }: StatCardProps) {
  return (
    <Card className={cn("gap-3 py-5", highlight && "border-destructive/40 bg-destructive/5")}>
      <CardHeader className="gap-1 px-5">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <CardAction>
          <Icon
            className={cn("size-4 text-muted-foreground", highlight && "text-destructive")}
            aria-hidden="true"
          />
        </CardAction>
      </CardHeader>
      <CardContent className="px-5">
        <p
          className={cn(
            "text-3xl font-semibold tracking-tight tabular-nums",
            highlight && "text-destructive",
          )}
        >
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
