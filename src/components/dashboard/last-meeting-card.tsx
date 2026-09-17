import Link from "next/link";
import { CalendarCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import type { DashboardMetrics } from "@/types/api";

interface LastMeetingCardProps {
  meeting: DashboardMetrics["lastMeeting"];
}

export function LastMeetingCard({ meeting }: LastMeetingCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Último culto</CardTitle>
        <CardDescription>
          {meeting ? meeting.type.name : "Nenhum culto registrado ainda"}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {meeting ? (
          <div className="space-y-4">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarCheck className="size-4 shrink-0" aria-hidden="true" />
              {formatDateTime(meeting.date)}
            </p>
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {formatNumber(meeting.totalPresent)}
                </p>
                <p className="text-xs text-muted-foreground">presentes</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {formatPercent(meeting.attendanceRate)}
                </p>
                <p className="text-xs text-muted-foreground">dos membros ativos</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Registre um culto para começar a acompanhar a presença da congregação.
          </p>
        )}
      </CardContent>

      <CardFooter>
        {meeting ? (
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/meetings/${meeting.id}/attendance`}>Abrir chamada</Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/meetings">Cadastrar culto</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
