"use client";

import { useCallback, useEffect, useState } from "react";
import { TrendingUp, TriangleAlert, UserPlus, Users } from "lucide-react";

import { AbsenceAlertList } from "@/components/dashboard/absence-alert-list";
import { AttendanceTrendChart } from "@/components/dashboard/attendance-trend-chart";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { LastMeetingCard } from "@/components/dashboard/last-meeting-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";
import { getAbsenceAlerts, getDashboard } from "@/lib/api/metrics";
import { formatNumber, formatPercent } from "@/lib/format";
import type { AbsenceAlertsResponse, DashboardMetrics } from "@/types/api";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return "Não foi possível carregar o dashboard.";
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [alerts, setAlerts] = useState<AbsenceAlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboard, absence] = await Promise.all([getDashboard(), getAbsenceAlerts()]);
      setMetrics(dashboard);
      setAlerts(absence);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <PageHeader title="Dashboard" description="Visão geral da congregação" />

      {loading ? <DashboardSkeleton /> : null}

      {!loading && error ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center">
          <div className="space-y-1">
            <p className="font-medium">Não foi possível carregar o dashboard</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button onClick={() => void load()}>Tentar novamente</Button>
        </div>
      ) : null}

      {!loading && !error && metrics ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Membros ativos"
              value={formatNumber(metrics.activeMembers)}
              hint={`${formatNumber(metrics.inactiveMembers)} inativos`}
              icon={Users}
            />
            <StatCard
              title="Presença média"
              value={formatNumber(metrics.averageAttendance, 1)}
              hint={`${formatPercent(metrics.averageAttendanceRate)} dos membros ativos`}
              icon={TrendingUp}
            />
            <StatCard
              title="Alertas de ausência"
              value={formatNumber(metrics.absenceAlertCount)}
              hint="membros precisando de contato"
              icon={TriangleAlert}
              highlight={metrics.absenceAlertCount > 0}
            />
            <StatCard
              title="Visitantes"
              value={formatNumber(metrics.totalVisitors)}
              hint={`${formatNumber(metrics.visitorsThisMonth)} neste mês`}
              icon={UserPlus}
            />
          </div>

          <AttendanceTrendChart data={metrics.attendanceTrend} />

          <div className="grid gap-4 lg:grid-cols-2">
            <LastMeetingCard meeting={metrics.lastMeeting} />
            <AbsenceAlertList
              alerts={alerts?.items ?? []}
              total={alerts?.meta.total ?? metrics.absenceAlertCount}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
