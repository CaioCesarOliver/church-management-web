"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarX2, CheckCheck, Eraser, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

import { AttendanceCounter } from "@/components/attendance/attendance-counter";
import { AttendanceList, type AttendanceListItem } from "@/components/attendance/attendance-list";
import { AttendanceSkeleton } from "@/components/attendance/attendance-skeleton";
import { QuickRegisterDialog } from "@/components/attendance/quick-register-dialog";
import { matchesSearch } from "@/components/attendance/search";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { ErrorState, errorMessage } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { P, can } from "@/lib/permissions";
import { ApiError } from "@/lib/api-client";
import {
  getAttendanceSheet,
  replaceAttendance,
  toggleMemberAttendance,
  toggleVisitorAttendance,
  type BulkAttendanceEntry,
} from "@/lib/api/attendance";
import { useAuth } from "@/lib/auth-context";
import { formatDateLong, formatNumber } from "@/lib/format";
import type { AttendanceSheet } from "@/types/api";

type ListTab = "members" | "visitors";
type BulkAction = "mark" | "clear";

export default function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: meetingId } = use(params);
  const { user } = useAuth();
  const editable = can(user, P.attendanceManage);

  const [sheet, setSheet] = useState<AttendanceSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<ListTab>("members");
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);

  // Toggles fire in quick succession and their responses can land out of order.
  // Only a summary newer than the last one applied is allowed to move the
  // counter, so a slow early response cannot roll the number backwards.
  const requestSeq = useRef(0);
  const appliedSeq = useRef(0);

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const data = await getAttendanceSheet(meetingId);
        appliedSeq.current = ++requestSeq.current;
        setSheet(data);
      } catch (err) {
        if (options?.silent) {
          toast.error(errorMessage(err));
        } else {
          setError(err);
        }
      } finally {
        if (!options?.silent) setLoading(false);
      }
    },
    [meetingId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const applySummary = useCallback((seq: number, summary: AttendanceSheet["summary"]) => {
    if (seq < appliedSeq.current) return;
    appliedSeq.current = seq;
    setSheet((prev) => (prev ? { ...prev, summary } : prev));
  }, []);

  /**
   * Optimistic on purpose: the row flips before the request leaves. A round trip
   * per person on church wifi would leave the secretary waiting in front of the
   * queue. On failure the row goes back to where it was and a toast explains why.
   */
  const toggleMember = useCallback(
    async (memberId: string, present: boolean) => {
      setSheet((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members.map((row) =>
                row.memberId === memberId ? { ...row, present } : row,
              ),
            }
          : prev,
      );

      const seq = ++requestSeq.current;
      try {
        const result = await toggleMemberAttendance(meetingId, memberId, present);
        applySummary(seq, result.summary);
      } catch (err) {
        setSheet((prev) =>
          prev
            ? {
                ...prev,
                members: prev.members.map((row) =>
                  row.memberId === memberId ? { ...row, present: !present } : row,
                ),
              }
            : prev,
        );
        toast.error(errorMessage(err));
      }
    },
    [meetingId, applySummary],
  );

  const toggleVisitor = useCallback(
    async (visitorId: string, present: boolean) => {
      setSheet((prev) =>
        prev
          ? {
              ...prev,
              visitors: prev.visitors.map((row) =>
                row.visitorId === visitorId ? { ...row, present } : row,
              ),
            }
          : prev,
      );

      const seq = ++requestSeq.current;
      try {
        const result = await toggleVisitorAttendance(meetingId, visitorId, present);
        applySummary(seq, result.summary);
      } catch (err) {
        setSheet((prev) =>
          prev
            ? {
                ...prev,
                visitors: prev.visitors.map((row) =>
                  row.visitorId === visitorId ? { ...row, present: !present } : row,
                ),
              }
            : prev,
        );
        toast.error(errorMessage(err));
      }
    },
    [meetingId, applySummary],
  );

  async function runBulk(action: BulkAction) {
    if (!sheet) return;
    const present = action === "mark";
    const entries: BulkAttendanceEntry[] = [
      ...sheet.members.map((row) => ({ memberId: row.memberId, present })),
      ...sheet.visitors.map((row) => ({ visitorId: row.visitorId, present })),
    ];

    try {
      const fresh = await replaceAttendance(meetingId, entries);
      appliedSeq.current = ++requestSeq.current;
      setSheet(fresh);
      toast.success(present ? "Todos marcados como presentes." : "Chamada limpa.");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const memberItems = useMemo<AttendanceListItem[]>(
    () =>
      (sheet?.members ?? [])
        .filter((row) => matchesSearch(row.name, search))
        .map((row) => ({ id: row.memberId, name: row.name, phone: row.phone, present: row.present })),
    [sheet, search],
  );

  const visitorItems = useMemo<AttendanceListItem[]>(
    () =>
      (sheet?.visitors ?? [])
        .filter((row) => matchesSearch(row.name, search))
        .map((row) => ({ id: row.visitorId, name: row.name, phone: row.phone, present: row.present })),
    [sheet, search],
  );

  const searching = search.trim().length > 0;
  const notFound = error instanceof ApiError && error.status === 404;

  const backButton = (
    <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
      <Link href="/meetings">
        <ArrowLeft className="size-4" />
        Voltar para cultos
      </Link>
    </Button>
  );

  if (notFound) {
    return (
      <div className="space-y-4">
        <PageHeader title="Chamada" />
        <EmptyState
          icon={CalendarX2}
          title="Culto não encontrado."
          description="Ele pode ter sido removido ou o endereço está incorreto."
        >
          <Button asChild>
            <Link href="/meetings">Voltar para cultos</Link>
          </Button>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={sheet ? sheet.meeting.type.name : "Chamada"}
        description={
          sheet
            ? [formatDateLong(sheet.meeting.date), sheet.meeting.description]
                .filter(Boolean)
                .join(" · ")
            : undefined
        }
      >
        {backButton}
      </PageHeader>

      {loading ? <AttendanceSkeleton /> : null}

      {!loading && error ? <ErrorState error={error} onRetry={() => void load()} /> : null}

      {!loading && !error && sheet ? (
        <div className="space-y-4">
          <AttendanceCounter summary={sheet.summary} />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por nome"
              autoFocus
            />

            {editable ? (
              <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => setBulkAction("mark")}
                  className="w-full sm:w-auto"
                >
                  <CheckCheck className="size-4" />
                  Marcar todos
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setBulkAction("clear")}
                  className="w-full sm:w-auto"
                >
                  <Eraser className="size-4" />
                  Limpar todos
                </Button>
                <Button onClick={() => setRegisterOpen(true)} className="w-full sm:w-auto">
                  <UserPlus className="size-4" />
                  Cadastrar
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm sm:ml-auto">Somente leitura.</p>
            )}
          </div>

          <Tabs value={tab} onValueChange={(value) => setTab(value as ListTab)}>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="members">
                Membros ({formatNumber(memberItems.length)})
              </TabsTrigger>
              <TabsTrigger value="visitors">
                Visitantes ({formatNumber(visitorItems.length)})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="pt-2">
              <AttendanceList
                items={memberItems}
                disabled={!editable}
                onToggle={(memberId, present) => void toggleMember(memberId, present)}
                empty={
                  searching ? (
                    <EmptyState
                      icon={Users}
                      title="Nenhum membro encontrado."
                      description={`Nada corresponde a "${search.trim()}". Cadastre a pessoa sem sair da chamada.`}
                    >
                      {editable ? (
                        <Button onClick={() => setRegisterOpen(true)}>
                          <UserPlus className="size-4" />
                          Cadastrar
                        </Button>
                      ) : null}
                    </EmptyState>
                  ) : (
                    <EmptyState
                      icon={Users}
                      title="Nenhum membro ativo."
                      description="Cadastre os membros da congregação para fazer a chamada."
                    >
                      {editable ? (
                        <Button asChild variant="outline">
                          <Link href="/members">Ir para membros</Link>
                        </Button>
                      ) : null}
                    </EmptyState>
                  )
                }
              />
            </TabsContent>

            <TabsContent value="visitors" className="pt-2">
              <AttendanceList
                items={visitorItems}
                disabled={!editable}
                onToggle={(visitorId, present) => void toggleVisitor(visitorId, present)}
                empty={
                  searching ? (
                    <EmptyState
                      icon={UserPlus}
                      title="Nenhum visitante encontrado."
                      description={`Nada corresponde a "${search.trim()}". Cadastre quem acabou de chegar.`}
                    >
                      {editable ? (
                        <Button onClick={() => setRegisterOpen(true)}>
                          <UserPlus className="size-4" />
                          Cadastrar
                        </Button>
                      ) : null}
                    </EmptyState>
                  ) : (
                    <EmptyState
                      icon={UserPlus}
                      title="Nenhum visitante neste culto."
                      description="Cadastre quem chegou visitando: a pessoa já entra marcada como presente."
                    >
                      {editable ? (
                        <Button onClick={() => setRegisterOpen(true)}>
                          <UserPlus className="size-4" />
                          Cadastrar
                        </Button>
                      ) : null}
                    </EmptyState>
                  )
                }
              />
            </TabsContent>
          </Tabs>
        </div>
      ) : null}

      <ConfirmDialog
        open={bulkAction === "mark"}
        onOpenChange={(open) => setBulkAction(open ? "mark" : null)}
        title="Marcar todos como presentes?"
        description="Todos os membros e visitantes desta lista ficarão presentes, substituindo as marcações feitas até agora."
        confirmLabel="Marcar todos"
        onConfirm={() => runBulk("mark")}
      />

      <ConfirmDialog
        open={bulkAction === "clear"}
        onOpenChange={(open) => setBulkAction(open ? "clear" : null)}
        title="Limpar toda a chamada?"
        description="Todas as presenças deste culto serão desmarcadas. Não é possível desfazer."
        confirmLabel="Limpar todos"
        destructive
        onConfirm={() => runBulk("clear")}
      />

      <QuickRegisterDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        meetingId={meetingId}
        defaultName={search}
        onRegistered={(kind) => {
          // Land on the tab the new person is in, so the secretary sees the row.
          setTab(kind === "member" ? "members" : "visitors");
          return load({ silent: true });
        }}
      />
    </div>
  );
}
