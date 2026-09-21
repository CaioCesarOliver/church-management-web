"use client";

import { useRouter } from "next/navigation";
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
import { firstAllowedPath } from "@/components/nav-items";
import { useAuth } from "@/lib/auth-context";
import { P, can } from "@/lib/permissions";
import { formatNumber, formatPercent } from "@/lib/format";
import type { AbsenceAlertsResponse, DashboardMetrics } from "@/types/api";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return "Não foi possível carregar o dashboard.";
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: loadingUser } = useAuth();
  /**
   * Alertas de ausência são dado pastoral, e vêm do endpoint de métricas.
   *
   * Quem tem o Dashboard mas não tem Métricas — a recepcionista, por exemplo —
   * vê os números gerais e NÃO vê quem anda faltando. Sem esta separação a tela
   * inteira falhava por causa de um cartão, e a pessoa recebia "sem permissão"
   * numa tela que ela pode abrir.
   */
  const showAlerts = can(user, P.metricsView);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [alerts, setAlerts] = useState<AbsenceAlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboard, absence] = await Promise.all([
        getDashboard(),
        showAlerts ? getAbsenceAlerts() : Promise.resolve(null),
      ]);
      setMetrics(dashboard);
      setAlerts(absence);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [showAlerts]);

  useEffect(() => {
    // Sem permissão para o Dashboard, esta rota não é destino: manda para a
    // primeira tela que a pessoa consegue abrir. Deixá-la aqui mostraria um erro
    // de permissão logo após o login, na tela que o login escolheu.
    if (loadingUser || !user) return;
    if (!can(user, P.dashboardView)) {
      const fallback = firstAllowedPath(user);
      if (fallback && fallback !== "/") router.replace(fallback);
      return;
    }
    void load();
  }, [loadingUser, user, load, router]);

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
            {showAlerts ? (
              <AbsenceAlertList
                alerts={alerts?.items ?? []}
                total={alerts?.meta.total ?? metrics.absenceAlertCount}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
