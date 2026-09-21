"use client";

import type { ReactNode } from "react";

import { PageHeader } from "@/components/page-header";
import { AccessDeniedCard } from "@/components/settings/access-denied-card";
import { P, canAny } from "@/lib/permissions";
import { useAuth } from "@/lib/auth-context";

/**
 * Shell for every settings section.
 *
 * A navegação vive na SIDEBAR, como submenu — não aqui dentro. Já foram seis
 * abas numa tela só, depois uma coluna de navegação própria; as duas viravam
 * depósito conforme a área crescia. Agora cada seção é um destino de primeira
 * classe no menu principal, e este arquivo só monta a moldura.
 */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Entra em Configurações quem enxerga QUALQUER coisa lá dentro: a área
  // agrupa parametrização da congregação e gestão de acessos, e são
  // permissões diferentes.
  if (!canAny(user, P.settingsView, P.usersView) || !user) {
    return (
      <div className="space-y-4">
        <PageHeader title="Configurações" />
        <AccessDeniedCard />
      </div>
    );
  }

  // O aviso de somente-leitura some: cada seção já recebe o próprio `readOnly`
  // conforme a permissão que lhe cabe, e um aviso genérico no topo mentiria para
  // quem pode editar uma seção e não outra.
  return <div className="min-w-0 space-y-4">{children}</div>;
}
