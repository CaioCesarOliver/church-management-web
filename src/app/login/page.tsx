"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

/**
 * DEVELOPMENT SCAFFOLDING — the "Acesso de demonstração" block below exposes the
 * seeded accounts and their shared password. Remove it (and the constant) before
 * this system is reachable from the public internet.
 */
const DEMO_PASSWORD = "senha123";
const DEMO_ACCOUNTS = [
  { email: "super@paulistana.org", role: "Super Admin" },
  { email: "admin@paulistana.org", role: "Administrador" },
  { email: "secretaria@paulistana.org", role: "Secretária" },
  { email: "pastor@paulistana.org", role: "Pastor (somente leitura)" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      // `login` stores the session and redirects to "/" on its own.
      await login(email.trim(), password);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível entrar. Verifique sua conexão e tente novamente.",
      );
      setSubmitting(false);
    }
  }

  function fillDemoAccount(demoEmail: string) {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError(null);
    emailRef.current?.focus();
  }

  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-muted/40">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Carregando" />
      </main>
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandLogo size={64} />
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-balance">
              Assembleia de Deus Paulistana
            </h1>
            <p className="text-sm text-muted-foreground text-pretty">
              Entre para gerenciar membros, cultos e chamada.
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  ref={emailRef}
                  type="email"
                  autoComplete="email"
                  autoFocus
                  required
                  placeholder="voce@paulistana.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    tabIndex={-1}
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Entrando…
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <div className="rounded-md border border-dashed bg-muted/50 p-3">
              <p className="text-xs font-medium text-foreground">Acesso de demonstração</p>
              <div className="mt-2 grid gap-1">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => fillDemoAccount(account.email)}
                    disabled={submitting}
                    className="flex flex-col items-start gap-0.5 rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 sm:flex-row sm:items-center sm:justify-between sm:gap-2"
                  >
                    <span className="text-xs font-medium break-all">{account.email}</span>
                    <span className="text-xs text-muted-foreground">{account.role}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 px-2 text-xs text-muted-foreground">
                Senha de todos: <span className="font-mono">{DEMO_PASSWORD}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
