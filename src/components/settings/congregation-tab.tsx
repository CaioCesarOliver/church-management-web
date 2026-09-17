"use client";

import { CalendarDays, Loader2, UserPlus, Users, UserSquare } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ErrorState } from "@/components/error-state";
import { CongregationTabSkeleton } from "@/components/settings/settings-skeletons";
import { SettingsStatCard } from "@/components/settings/settings-stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import {
  updateCurrentCongregationDetails,
  type CurrentCongregationInput,
} from "@/lib/api/congregation";
import { getCurrentCongregation } from "@/lib/api/settings";
import { formatDate, formatNumber } from "@/lib/format";
import type { CongregationDetail, EffectiveRule } from "@/types/api";

const SLUG_PATTERN = /^[a-z0-9-]+$/;

/** The zones a Brazilian congregation can plausibly be in. */
const TIMEZONE_OPTIONS = [
  { value: "America/Sao_Paulo", label: "São Paulo (UTC−3)" },
  { value: "America/Manaus", label: "Manaus (UTC−4)" },
  { value: "America/Belem", label: "Belém (UTC−3)" },
  { value: "America/Fortaleza", label: "Fortaleza (UTC−3)" },
  { value: "America/Cuiaba", label: "Cuiabá (UTC−4)" },
  { value: "America/Rio_Branco", label: "Rio Branco (UTC−5)" },
];

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

interface IdentityForm {
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
  timezone: string;
  logoUrl: string;
}

function toIdentityForm(congregation: CongregationDetail): IdentityForm {
  return {
    name: congregation.name,
    slug: congregation.slug,
    address: congregation.address ?? "",
    phone: congregation.phone ?? "",
    email: congregation.email ?? "",
    timezone: congregation.timezone || DEFAULT_TIMEZONE,
    logoUrl: congregation.logoUrl ?? "",
  };
}

/** Rules are typed as text so "" can mean "inherit the installation default". */
interface RulesForm {
  attendanceRateWindow: string;
  absenceAlertDays: string;
  absenceAlertConsecutiveMeetings: string;
}

function toRulesForm(congregation: CongregationDetail): RulesForm {
  return {
    attendanceRateWindow: congregation.attendanceRateWindow?.toString() ?? "",
    absenceAlertDays: congregation.absenceAlertDays?.toString() ?? "",
    absenceAlertConsecutiveMeetings:
      congregation.absenceAlertConsecutiveMeetings?.toString() ?? "",
  };
}

/** An empty input clears the override; the API reads `null` as "inherit". */
function toOverride(value: string): number | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : Number(trimmed);
}

function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

interface RuleFieldProps {
  id: string;
  label: string;
  hint: string;
  rule: EffectiveRule;
  value: string;
  min: number;
  max: number;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

function RuleField({
  id,
  label,
  hint,
  rule,
  value,
  min,
  max,
  error,
  disabled,
  onChange,
}: RuleFieldProps) {
  const inheriting = value.trim() === "";

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        // An empty field shows what is actually in force, so nobody has to guess.
        placeholder={String(rule.value)}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={`${id}-hint`}
      />
      <p id={`${id}-hint`} className="text-xs text-muted-foreground">
        {hint} Entre {min} e {max}.
        {inheriting ? (
          <span className="ml-1 font-medium">
            Em branco: herdado do padrão da instalação ({formatNumber(rule.value)}).
          </span>
        ) : null}
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

interface CongregationTabProps {
  /** PASTOR sees the congregation data but cannot edit it. */
  readOnly?: boolean;
}

export function CongregationTab({ readOnly = false }: CongregationTabProps) {
  const [congregation, setCongregation] = useState<CongregationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [identity, setIdentity] = useState<IdentityForm | null>(null);
  const [identityErrors, setIdentityErrors] = useState<Record<string, string>>({});
  const [savingIdentity, setSavingIdentity] = useState(false);

  const [rules, setRules] = useState<RulesForm | null>(null);
  const [ruleErrors, setRuleErrors] = useState<Record<string, string>>({});
  const [savingRules, setSavingRules] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCurrentCongregation();
      setCongregation(result);
      setIdentity(toIdentityForm(result));
      setRules(toRulesForm(result));
      setIdentityErrors({});
      setRuleErrors({});
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function applyResult(updated: CongregationDetail) {
    setCongregation(updated);
    setIdentity(toIdentityForm(updated));
    setRules(toRulesForm(updated));
  }

  function reportError(err: unknown, fallback: string): Record<string, string> {
    if (err instanceof ApiError) {
      const fieldErrors = err.fieldErrors;
      toast.error(err.message);
      // A taken slug comes back as a 409 with no per-field detail.
      if (err.status === 409 && Object.keys(fieldErrors).length === 0) {
        return { slug: err.message };
      }
      return fieldErrors;
    }
    toast.error(fallback);
    return {};
  }

  async function handleIdentitySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!congregation || !identity) return;

    const name = identity.name.trim();
    const slug = identity.slug.trim();
    const email = identity.email.trim();

    const found: Record<string, string> = {};
    if (name.length < 2) found.name = "Informe ao menos 2 caracteres.";
    if (slug.length < 2) {
      found.slug = "Informe ao menos 2 caracteres.";
    } else if (!SLUG_PATTERN.test(slug)) {
      found.slug = "Use apenas letras minúsculas, números e hífens.";
    }
    if (email !== "" && !email.includes("@")) found.email = "Informe um e-mail válido.";

    setIdentityErrors(found);
    if (Object.keys(found).length > 0) return;

    setSavingIdentity(true);
    try {
      applyResult(
        await updateCurrentCongregationDetails({
          name,
          slug,
          address: orNull(identity.address),
          phone: orNull(identity.phone),
          email: orNull(email),
          timezone: identity.timezone,
          logoUrl: orNull(identity.logoUrl),
        }),
      );
      setIdentityErrors({});
      toast.success("Dados da congregação atualizados.");
    } catch (err) {
      setIdentityErrors(reportError(err, "Não foi possível salvar os dados da congregação."));
    } finally {
      setSavingIdentity(false);
    }
  }

  async function handleRulesSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!congregation || !rules) return;

    const bounds: Record<keyof RulesForm, { min: number; max: number }> = {
      attendanceRateWindow: { min: 1, max: 52 },
      absenceAlertDays: { min: 1, max: 365 },
      absenceAlertConsecutiveMeetings: { min: 1, max: 52 },
    };

    const found: Record<string, string> = {};
    for (const key of Object.keys(bounds) as Array<keyof RulesForm>) {
      const raw = rules[key].trim();
      if (raw === "") continue;
      const parsed = Number(raw);
      const { min, max } = bounds[key];
      if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
        found[key] = `Informe um número inteiro entre ${min} e ${max}, ou deixe em branco.`;
      }
    }

    setRuleErrors(found);
    if (Object.keys(found).length > 0) return;

    const payload: CurrentCongregationInput = {
      attendanceRateWindow: toOverride(rules.attendanceRateWindow),
      absenceAlertDays: toOverride(rules.absenceAlertDays),
      absenceAlertConsecutiveMeetings: toOverride(rules.absenceAlertConsecutiveMeetings),
    };

    setSavingRules(true);
    try {
      applyResult(await updateCurrentCongregationDetails(payload));
      setRuleErrors({});
      toast.success("Regras de acompanhamento atualizadas.");
    } catch (err) {
      setRuleErrors(reportError(err, "Não foi possível salvar as regras de acompanhamento."));
    } finally {
      setSavingRules(false);
    }
  }

  if (loading) return <CongregationTabSkeleton />;

  if (error || !congregation || !identity || !rules) {
    return (
      <Card className="py-0">
        <CardContent className="p-0">
          <ErrorState
            error={error}
            onRetry={() => void load()}
            title="Não foi possível carregar a congregação"
          />
        </CardContent>
      </Card>
    );
  }

  const currentIdentity = identity;
  const currentRules = rules;

  const identityDirty =
    JSON.stringify(currentIdentity) !== JSON.stringify(toIdentityForm(congregation));
  const rulesDirty = JSON.stringify(currentRules) !== JSON.stringify(toRulesForm(congregation));

  function setIdentityField<K extends keyof IdentityForm>(key: K, value: IdentityForm[K]) {
    setIdentity((current) => (current ? { ...current, [key]: value } : current));
  }

  function setRuleField<K extends keyof RulesForm>(key: K, value: string) {
    setRules((current) => (current ? { ...current, [key]: value } : current));
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SettingsStatCard
          title="Membros"
          value={formatNumber(congregation.stats.members)}
          icon={Users}
        />
        <SettingsStatCard
          title="Visitantes"
          value={formatNumber(congregation.stats.visitors)}
          icon={UserPlus}
        />
        <SettingsStatCard
          title="Cultos"
          value={formatNumber(congregation.stats.meetings)}
          icon={CalendarDays}
        />
        <SettingsStatCard
          title="Usuários"
          value={formatNumber(congregation.stats.users)}
          icon={UserSquare}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da congregação</CardTitle>
          <CardDescription>
            Congregação criada em {formatDate(congregation.createdAt)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleIdentitySubmit} className="space-y-5" noValidate>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="congregation-name">Nome</Label>
                <Input
                  id="congregation-name"
                  value={currentIdentity.name}
                  onChange={(event) => setIdentityField("name", event.target.value)}
                  disabled={readOnly}
                  placeholder="Igreja Central"
                  aria-invalid={Boolean(identityErrors.name)}
                  aria-describedby={identityErrors.name ? "congregation-name-error" : undefined}
                />
                {identityErrors.name ? (
                  <p id="congregation-name-error" className="text-sm text-destructive">
                    {identityErrors.name}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="congregation-slug">Slug</Label>
                <Input
                  id="congregation-slug"
                  value={currentIdentity.slug}
                  onChange={(event) => setIdentityField("slug", event.target.value)}
                  disabled={readOnly}
                  placeholder="igreja-central"
                  spellCheck={false}
                  autoCapitalize="none"
                  aria-invalid={Boolean(identityErrors.slug)}
                  aria-describedby="congregation-slug-hint"
                />
                <p id="congregation-slug-hint" className="text-xs text-muted-foreground">
                  Identificador único usado em endereços. Apenas letras minúsculas, números e
                  hífens.
                </p>
                {identityErrors.slug ? (
                  <p className="text-sm text-destructive">{identityErrors.slug}</p>
                ) : null}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="congregation-address">Endereço</Label>
                <Input
                  id="congregation-address"
                  value={currentIdentity.address}
                  onChange={(event) => setIdentityField("address", event.target.value)}
                  disabled={readOnly}
                  placeholder="Rua das Acácias, 120 — Centro"
                  autoComplete="street-address"
                  aria-invalid={Boolean(identityErrors.address)}
                />
                {identityErrors.address ? (
                  <p className="text-sm text-destructive">{identityErrors.address}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="congregation-phone">Telefone</Label>
                <Input
                  id="congregation-phone"
                  value={currentIdentity.phone}
                  onChange={(event) => setIdentityField("phone", event.target.value)}
                  disabled={readOnly}
                  placeholder="(11) 3333-4444"
                  inputMode="tel"
                  autoComplete="tel"
                  aria-invalid={Boolean(identityErrors.phone)}
                />
                {identityErrors.phone ? (
                  <p className="text-sm text-destructive">{identityErrors.phone}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="congregation-email">E-mail</Label>
                <Input
                  id="congregation-email"
                  type="email"
                  value={currentIdentity.email}
                  onChange={(event) => setIdentityField("email", event.target.value)}
                  disabled={readOnly}
                  placeholder="contato@igreja.org"
                  autoComplete="email"
                  aria-invalid={Boolean(identityErrors.email)}
                />
                {identityErrors.email ? (
                  <p className="text-sm text-destructive">{identityErrors.email}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="congregation-timezone">Fuso horário</Label>
                <Select
                  value={currentIdentity.timezone}
                  onValueChange={(value) => setIdentityField("timezone", value)}
                  disabled={readOnly}
                >
                  <SelectTrigger id="congregation-timezone" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Define o horário em que datas e horas dos cultos são interpretadas.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="congregation-logo">URL da logo</Label>
                <Input
                  id="congregation-logo"
                  type="url"
                  value={currentIdentity.logoUrl}
                  onChange={(event) => setIdentityField("logoUrl", event.target.value)}
                  disabled={readOnly}
                  placeholder="https://…/logo.png"
                  spellCheck={false}
                  aria-invalid={Boolean(identityErrors.logoUrl)}
                />
                {identityErrors.logoUrl ? (
                  <p className="text-sm text-destructive">{identityErrors.logoUrl}</p>
                ) : null}
              </div>
            </div>

            {readOnly ? null : (
              <Button
                type="submit"
                disabled={!identityDirty || savingIdentity}
                className="w-full sm:w-auto"
              >
                {savingIdentity ? <Loader2 className="size-4 animate-spin" /> : null}
                Salvar alterações
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Estes três números são o que dispara os alertas de ausência — e uma congregação que se
          reúne três vezes por semana precisa de valores bem diferentes de uma que se reúne a cada
          quinze dias.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Regras de acompanhamento</CardTitle>
            <CardDescription>
              Deixe um campo em branco para seguir o padrão da instalação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRulesSubmit} className="space-y-5" noValidate>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <RuleField
                  id="rule-attendance-window"
                  label="Cultos considerados na assiduidade"
                  hint="Quantos cultos recentes entram no cálculo da taxa de presença."
                  rule={congregation.rules.attendanceRateWindow}
                  value={currentRules.attendanceRateWindow}
                  min={1}
                  max={52}
                  error={ruleErrors.attendanceRateWindow}
                  disabled={readOnly}
                  onChange={(value) => setRuleField("attendanceRateWindow", value)}
                />

                <RuleField
                  id="rule-absence-days"
                  label="Dias sem presença para gerar alerta"
                  hint="Tempo sem comparecer que coloca o membro na lista de alertas."
                  rule={congregation.rules.absenceAlertDays}
                  value={currentRules.absenceAlertDays}
                  min={1}
                  max={365}
                  error={ruleErrors.absenceAlertDays}
                  disabled={readOnly}
                  onChange={(value) => setRuleField("absenceAlertDays", value)}
                />

                <RuleField
                  id="rule-absence-consecutive"
                  label="Faltas seguidas para gerar alerta"
                  hint="Quantos cultos seguidos sem presença geram o alerta."
                  rule={congregation.rules.absenceAlertConsecutiveMeetings}
                  value={currentRules.absenceAlertConsecutiveMeetings}
                  min={1}
                  max={52}
                  error={ruleErrors.absenceAlertConsecutiveMeetings}
                  disabled={readOnly}
                  onChange={(value) => setRuleField("absenceAlertConsecutiveMeetings", value)}
                />
              </div>

              {readOnly ? null : (
                <Button
                  type="submit"
                  disabled={!rulesDirty || savingRules}
                  className="w-full sm:w-auto"
                >
                  {savingRules ? <Loader2 className="size-4 animate-spin" /> : null}
                  Salvar regras
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
