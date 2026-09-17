import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDaysAgo } from "@/lib/format";
import { ABSENCE_REASON_LABELS } from "@/lib/labels";
import type { AbsenceAlert } from "@/types/api";

const MAX_ROWS = 5;

interface AbsenceAlertListProps {
  alerts: AbsenceAlert[];
  total: number;
}

export function AbsenceAlertList({ alerts, total }: AbsenceAlertListProps) {
  const rows = alerts.slice(0, MAX_ROWS);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Alertas de ausência</CardTitle>
        <CardDescription>
          {total > 0
            ? `${total} ${total === 1 ? "membro precisa" : "membros precisam"} de contato`
            : "Acompanhamento em dia"}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum membro em alerta no momento.</p>
        ) : (
          <ul className="divide-y">
            {rows.map((alert) => (
              <li
                key={alert.memberId}
                className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{alert.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDaysAgo(alert.daysSinceLastAttendance)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1 sm:justify-end">
                  {alert.reasons.map((reason) => (
                    <Badge key={reason} variant="outline" className="text-[11px]">
                      {ABSENCE_REASON_LABELS[reason]}
                    </Badge>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {rows.length > 0 ? (
        <CardFooter>
          <Button asChild variant="ghost" size="sm" className="px-0 text-primary">
            <Link href="/metrics">Ver todos</Link>
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
