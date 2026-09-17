"use client";

import { useCallback, useEffect, useState } from "react";
import { Info, Phone, ShieldCheck } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { AlertsTabSkeleton } from "@/components/metrics/metrics-skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAbsenceAlerts } from "@/lib/api/metrics";
import { formatDaysAgo, formatPhone } from "@/lib/format";
import { ABSENCE_REASON_LABELS } from "@/lib/labels";
import type { AbsenceAlertsResponse } from "@/types/api";

interface Rule {
  days: number;
  consecutiveMeetings: number;
}

const DEFAULT_RULE: Rule = { days: 30, consecutiveMeetings: 3 };

function parseRuleInput(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function AbsenceAlertsTab() {
  const [draft, setDraft] = useState({
    days: String(DEFAULT_RULE.days),
    consecutiveMeetings: String(DEFAULT_RULE.consecutiveMeetings),
  });
  // Only the applied rule triggers a request — typing in the inputs must not refetch.
  const [rule, setRule] = useState<Rule>(DEFAULT_RULE);
  const [response, setResponse] = useState<AbsenceAlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResponse(await getAbsenceAlerts(rule));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [rule]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Rule = {
      days: parseRuleInput(draft.days, DEFAULT_RULE.days),
      consecutiveMeetings: parseRuleInput(
        draft.consecutiveMeetings,
        DEFAULT_RULE.consecutiveMeetings,
      ),
    };
    setDraft({ days: String(next.days), consecutiveMeetings: String(next.consecutiveMeetings) });
    setRule(next);
  }

  // The explanation echoes what the API actually applied, not what is typed.
  const applied = response?.meta ?? rule;

  return (
    <div className="space-y-4">
      <form
        onSubmit={applyRule}
        className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <div className="space-y-1.5">
          <Label htmlFor="alerts-days">Dias sem presença</Label>
          <Input
            id="alerts-days"
            type="number"
            inputMode="numeric"
            min={1}
            value={draft.days}
            onChange={(event) =>
              setDraft((current) => ({ ...current, days: event.target.value }))
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="alerts-consecutive">Cultos consecutivos</Label>
          <Input
            id="alerts-consecutive"
            type="number"
            inputMode="numeric"
            min={1}
            value={draft.consecutiveMeetings}
            onChange={(event) =>
              setDraft((current) => ({ ...current, consecutiveMeetings: event.target.value }))
            }
          />
        </div>

        <Button type="submit" className="w-full sm:w-auto">
          Aplicar
        </Button>
      </form>

      <div className="flex gap-3 rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          Um membro entra em alerta quando fica{" "}
          <span className="font-medium text-foreground">{applied.days} dias</span> sem presença
          registrada <span className="font-medium text-foreground">ou</span> falta aos últimos{" "}
          <span className="font-medium text-foreground">
            {applied.consecutiveMeetings} cultos
          </span>{" "}
          seguidos — basta uma das duas condições. Quem nunca compareceu conta a partir da data de
          cadastro.
        </p>
      </div>

      {loading ? (
        <AlertsTabSkeleton />
      ) : error ? (
        <Card>
          <CardContent>
            <ErrorState
              error={error}
              onRetry={() => void load()}
              title="Não foi possível carregar os alertas"
            />
          </CardContent>
        </Card>
      ) : !response || response.items.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={ShieldCheck}
              title="Nenhum membro em alerta no momento."
              description="Todos os membros têm presença recente."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {response.meta.total === 1
              ? "1 membro precisa de contato"
              : `${response.meta.total} membros precisam de contato`}
          </p>

          {/* Order comes from the API (never-attended first) and is kept as-is. */}
          {response.items.map((alert) => {
            const digits = alert.phone?.replace(/\D/g, "") ?? "";

            return (
              <Card key={alert.memberId}>
                <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                  <div className="min-w-0 space-y-1.5">
                    <p className="font-medium">{alert.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPhone(alert.phone)} · {formatDaysAgo(alert.daysSinceLastAttendance)} ·{" "}
                      {alert.consecutiveMissed === 1
                        ? "1 falta seguida"
                        : `${alert.consecutiveMissed} faltas seguidas`}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {alert.reasons.map((reason) => (
                        <Badge key={reason} variant="outline" className="text-[11px]">
                          {ABSENCE_REASON_LABELS[reason]}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {digits ? (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full shrink-0 sm:w-auto"
                    >
                      <a href={`tel:${digits}`} aria-label={`Ligar para ${alert.name}`}>
                        <Phone className="size-4" aria-hidden="true" />
                        Ligar
                      </a>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="w-full shrink-0 text-muted-foreground sm:w-auto"
                    >
                      Sem telefone
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
