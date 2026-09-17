"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { AttendanceStrip } from "@/components/members/attendance-strip";
import { AbsenceAlertBadge } from "@/components/members/attendance-summary";
import { ErrorState } from "@/components/error-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { getMember } from "@/lib/api/members";
import { formatDate, formatDaysAgo, formatPercent, formatPhone, initials } from "@/lib/format";
import { MEMBER_STATUS_LABELS } from "@/lib/labels";
import type { Member, MemberDetail } from "@/types/api";

interface MemberDetailSheetProps {
  memberId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canWrite: boolean;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}

export function MemberDetailSheet({
  memberId,
  open,
  onOpenChange,
  canWrite,
  onEdit,
  onDelete,
}: MemberDetailSheetProps) {
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      setMember(await getMember(id));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !memberId) return;
    setMember(null);
    void load(memberId);
  }, [open, memberId, load]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-b">
          {loading || !member ? (
            <>
              <SheetTitle className="sr-only">Detalhes do membro</SheetTitle>
              <SheetDescription className="sr-only">
                Carregando os dados do membro.
              </SheetDescription>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 pr-8">
                <Avatar className="size-10 shrink-0">
                  <AvatarFallback>{initials(member.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 space-y-1">
                  <SheetTitle className="truncate text-base">{member.name}</SheetTitle>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={member.status === "ACTIVE" ? "default" : "secondary"}>
                      {MEMBER_STATUS_LABELS[member.status]}
                    </Badge>
                    {member.convertedFromVisitor ? (
                      <Badge variant="outline" className="text-muted-foreground">
                        ex-visitante
                      </Badge>
                    ) : null}
                    {member.stats.inAbsenceAlert ? (
                      <AbsenceAlertBadge
                        reasons={member.stats.absenceReasons}
                        consecutiveMissed={member.stats.consecutiveMissed}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
              <SheetDescription>
                Cadastrado em {formatDate(member.createdAt)}
              </SheetDescription>
            </>
          )}
        </SheetHeader>

        <div className="flex-1 space-y-6 p-4">
          {loading ? (
            <div aria-busy="true" className="space-y-6">
              <span className="sr-only">Carregando os dados do membro…</span>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-3 w-40" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 10 }).map((_, index) => (
                  <Skeleton key={index} className="size-6 rounded-sm" />
                ))}
              </div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-4 w-full" />
                ))}
              </div>
            </div>
          ) : null}

          {!loading && error ? (
            <ErrorState
              error={error}
              onRetry={memberId ? () => void load(memberId) : undefined}
              title="Não foi possível carregar o membro"
            />
          ) : null}

          {!loading && !error && member ? (
            <>
              <section className="space-y-3">
                <h3 className="text-sm font-medium">Assiduidade</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold tabular-nums">
                    {member.stats.consideredCount > 0
                      ? formatPercent(member.stats.attendanceRate)
                      : "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {member.stats.consideredCount > 0
                      ? `${member.stats.attendedCount} de ${member.stats.consideredCount} cultos considerados`
                      : "sem cultos no período"}
                  </span>
                </div>
                <Progress
                  value={
                    member.stats.consideredCount > 0
                      ? Math.round(member.stats.attendanceRate * 100)
                      : 0
                  }
                  aria-label="Assiduidade do membro"
                  className="h-2"
                />
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <p className="text-sm">{formatDaysAgo(member.stats.daysSinceLastAttendance)}</p>
                    <p className="text-xs text-muted-foreground">
                      última presença
                      {member.stats.lastAttendanceAt
                        ? ` · ${formatDate(member.stats.lastAttendanceAt)}`
                        : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm tabular-nums">{member.stats.consecutiveMissed}</p>
                    <p className="text-xs text-muted-foreground">faltas consecutivas</p>
                  </div>
                </div>
              </section>

              <Separator />

              <section className="space-y-3">
                <h3 className="text-sm font-medium">Últimos cultos</h3>
                <AttendanceStrip entries={member.recentAttendance} />
              </section>

              <Separator />

              <section className="space-y-1">
                <h3 className="text-sm font-medium">Dados cadastrais</h3>
                <dl className="divide-y">
                  <DetailRow label="Telefone">{formatPhone(member.phone)}</DetailRow>
                  <DetailRow label="E-mail">{member.email ?? "—"}</DetailRow>
                  <DetailRow label="Nascimento">{formatDate(member.birthDate)}</DetailRow>
                  <DetailRow label="Batismo">{formatDate(member.baptismDate)}</DetailRow>
                  <DetailRow label="Endereço">{member.address ?? "—"}</DetailRow>
                  <DetailRow label="Observações">
                    <span className="whitespace-pre-wrap">{member.notes ?? "—"}</span>
                  </DetailRow>
                </dl>
              </section>
            </>
          ) : null}
        </div>

        {canWrite && member && !loading && !error ? (
          <SheetFooter className="flex-row border-t">
            <Button variant="outline" className="flex-1" onClick={() => onEdit(member)}>
              <Pencil />
              Editar
            </Button>
            <Button
              variant="outline"
              className="flex-1 text-destructive hover:text-destructive"
              onClick={() => onDelete(member)}
            >
              <Trash2 />
              Excluir
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
