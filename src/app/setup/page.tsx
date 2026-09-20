"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { BrandLogo } from "@/components/brand-logo";
import { ErrorState } from "@/components/error-state";
import { AccessCard, type CreatedAccess } from "@/components/setup/access-card";
import { CreateCongregationStep } from "@/components/setup/create-congregation-step";
import { SetupSteps, type SetupStep } from "@/components/setup/setup-steps";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listCongregations, switchCongregation } from "@/lib/api/settings";
import { useAuth } from "@/lib/auth-context";
import { USER_ROLE_LABELS } from "@/lib/labels";
import type { Congregation, UserRole } from "@/types/api";

/** The accounts offered in step 2, in the order they are most likely needed. */
const ACCESS_ROLES: UserRole[] = ["ADMIN", "SECRETARY", "PASTOR"];

type GuardState = "checking" | "ready" | "leaving" | "failed";

/**
 * First-run setup. Lives outside the `(app)` route group on purpose: there is no
 * congregation to render in the sidebar switcher yet, so the shell cannot mount.
 */
export default function SetupPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const [guard, setGuard] = useState<GuardState>("checking");
  const [guardError, setGuardError] = useState<unknown>(null);

  const [step, setStep] = useState<SetupStep>(1);
  const [congregation, setCongregation] = useState<Congregation | null>(null);
  const [accesses, setAccesses] = useState<CreatedAccess[]>([]);
  const [entering, setEntering] = useState(false);

  // Same rule as the app shell: never redirect while the stored session is still
  // being read back, or a refresh would bounce the user to /login.
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    // `guard !== "checking"` freezes the check after it has run once: the wizard
    // itself creates a congregation, and re-running would redirect away mid-flow.
    if (guard !== "checking" || loading || !user || user.role !== "SUPER_ADMIN") return;

    let cancelled = false;
    listCongregations()
      .then(async (items) => {
        if (cancelled) return;
        if (items.length === 0) {
          setGuard("ready");
          return;
        }

        // The installation is past first run — setup has nothing left to do.
        //
        // But simply going back to "/" is what used to hang the browser. The app
        // shell forwards a super admin with no active congregation to /setup, and
        // a super admin whose token was minted before the first congregation
        // existed arrives here with exactly that: no tenant, yet tenants to show.
        // Each screen then satisfied the other's redirect condition and they
        // bounced forever.
        //
        // The session is what is actually wrong, so this repairs it: adopt a
        // tenant, then leave with a token that says so. Whoever is already in a
        // congregation just leaves.
        setGuard("leaving");
        if (!user.congregation) {
          try {
            await switchCongregation(items[0].id);
          } catch {
            // Switching is the only way out of this state, so a failure has to
            // surface as a retry instead of a redirect that would bounce back.
            if (cancelled) return;
            setGuardError(
              new Error("Não foi possível entrar na congregação. Tente novamente."),
            );
            setGuard("failed");
            return;
          }
          if (cancelled) return;
          // Full reload, not a router push: the token changed, and every screen
          // must refetch its tenant-scoped data against the new one.
          window.location.replace("/");
          return;
        }
        router.replace("/");
      })
      .catch((error) => {
        if (cancelled) return;
        setGuardError(error);
        setGuard("failed");
      });

    return () => {
      cancelled = true;
    };
    // Flipping `guard` back to "checking" is what re-runs this on retry.
  }, [guard, loading, user, router]);

  function handleCongregationCreated(created: Congregation) {
    setCongregation(created);
    setStep(2);
  }

  function handleAccessCreated(access: CreatedAccess) {
    setAccesses((previous) => [...previous, access]);
  }

  async function handleEnter() {
    if (!congregation) return;
    setEntering(true);
    try {
      await switchCongregation(congregation.id);
      // A full reload rather than a router push: the session token now points at
      // a congregation it did not before, and every screen refetches its
      // tenant-scoped data from scratch instead of reusing what the wizard held.
      window.location.replace("/");
    } catch (error) {
      setEntering(false);
      toast.error(
        error instanceof Error ? error.message : "Não foi possível entrar na congregação.",
      );
    }
  }

  if (loading || !user || guard === "leaving") {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4" aria-busy="true">
          <Skeleton className="size-10 rounded-lg" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <span className="sr-only">Carregando…</span>
        </div>
      </main>
    );
  }

  if (user.role !== "SUPER_ADMIN") {
    return (
      <SetupShell>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ShieldAlert className="size-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Configuração inicial restrita</p>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                Somente um super administrador pode fazer a configuração inicial do sistema. Você
                entrou como {USER_ROLE_LABELS[user.role].toLowerCase()} — peça a quem administra o
                sistema para concluir esta etapa.
              </p>
            </div>
            <Button variant="outline" onClick={logout}>
              Sair
            </Button>
          </CardContent>
        </Card>
      </SetupShell>
    );
  }

  if (guard === "failed") {
    return (
      <SetupShell>
        <Card className="py-0">
          <CardContent className="p-0">
            <ErrorState
              error={guardError}
              title="Não foi possível verificar a instalação"
              onRetry={() => {
                setGuardError(null);
                setGuard("checking");
              }}
            />
          </CardContent>
        </Card>
      </SetupShell>
    );
  }

  if (guard === "checking") {
    return (
      <SetupShell>
        <Card className="py-0">
          <CardContent className="flex items-center justify-center gap-2 px-6 py-14 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Verificando a instalação…
          </CardContent>
        </Card>
      </SetupShell>
    );
  }

  return (
    <SetupShell steps={<SetupSteps current={step} />}>
      {step === 1 ? <CreateCongregationStep onCreated={handleCongregationCreated} /> : null}

      {step === 2 && congregation ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Criar os acessos</CardTitle>
              <CardDescription>
                Cadastre quem vai usar o sistema em{" "}
                <span className="font-medium text-foreground">{congregation.name}</span>. Todos são
                opcionais — você pode criar os que faltarem depois, em Configurações.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            {ACCESS_ROLES.map((role) => (
              <AccessCard
                key={role}
                role={role}
                congregationId={congregation.id}
                created={accesses.find((access) => access.role === role) ?? null}
                onCreated={handleAccessCreated}
              />
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button onClick={() => setStep(3)} className="w-full sm:w-auto">
              {accesses.length > 0 ? "Continuar" : "Pular por enquanto"}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 && congregation ? (
        <Card>
          <CardHeader>
            <CardTitle>Tudo pronto</CardTitle>
            <CardDescription>
              A configuração inicial foi concluída. Confira o que foi criado antes de entrar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Congregação</p>
              <div className="rounded-lg border p-3">
                <p className="font-medium break-words">{congregation.name}</p>
                <p className="font-mono text-xs text-muted-foreground break-all">
                  {congregation.slug}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Acessos</p>
              {accesses.length === 0 ? (
                <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                  Nenhum acesso criado. Você pode cadastrá-los em Configurações → Usuários.
                </p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {accesses.map((access) => (
                    <li
                      key={access.email}
                      className="flex flex-col gap-0.5 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium break-words">{access.name}</p>
                        <p className="text-sm text-muted-foreground break-all">{access.email}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {USER_ROLE_LABELS[access.role]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button onClick={() => void handleEnter()} className="w-full" disabled={entering}>
              {entering ? <Loader2 className="size-4 animate-spin" /> : null}
              Entrar na congregação
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </SetupShell>
  );
}

/** The centred, sidebar-less frame every state of this screen shares. */
function SetupShell({
  steps,
  children,
}: {
  steps?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-svh justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-3xl space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandLogo size={64} />
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-balance">
              Configuração inicial
            </h1>
            <p className="text-sm text-muted-foreground text-pretty">
              Vamos criar a primeira congregação e os acessos da equipe.
            </p>
          </div>
        </div>

        {steps}
        {children}
      </div>
    </main>
  );
}
