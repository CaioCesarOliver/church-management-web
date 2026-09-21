"use client";

import { PageHeader } from "@/components/page-header";
import { AccountTab } from "@/components/settings/account-tab";
import { useAuth } from "@/lib/auth-context";

/**
 * Minha conta vive FORA de /settings, de propósito.
 *
 * Trocar o próprio nome e a própria senha não é configurar a congregação, e
 * enquanto esta tela morava sob /settings ela herdava o guard de lá — uma
 * secretária ou recepcionista batia em "sem permissão" para mexer nos próprios
 * dados. Não há permissão a exigir aqui: quem conseguiu entrar é dono da
 * própria conta.
 */
export default function AccountPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="space-y-4">
      <PageHeader title="Minha conta" description="Seu nome e sua senha" />
      <AccountTab user={user} />
    </div>
  );
}
