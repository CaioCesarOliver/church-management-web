import { TriangleAlert } from "lucide-react";

/**
 * Faixa de identificação de ambiente.
 *
 * Homologação e produção são visualmente idênticas — mesmo layout, mesma marca,
 * dados de mentira dos dois lados até alguém cadastrar um membro de verdade. Sem
 * um sinal permanente na tela, cadastrar no ambiente errado é questão de tempo,
 * e o erro só aparece quando alguém procura o registro e não acha.
 *
 * Fica escondida em produção: um aviso que aparece sempre deixa de ser aviso.
 */

const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV?.trim().toLowerCase() ?? "";

const LABELS: Record<string, string> = {
  hml: "Homologação",
  homologacao: "Homologação",
  staging: "Homologação",
  dev: "Desenvolvimento",
  development: "Desenvolvimento",
  local: "Desenvolvimento",
};

export function EnvironmentBanner() {
  // Sem variável definida, ou definida como produção, não renderiza nada.
  if (!APP_ENV || APP_ENV === "production" || APP_ENV === "prd") return null;

  const label = LABELS[APP_ENV] ?? APP_ENV;

  return (
    <div
      role="status"
      className="bg-destructive/10 text-destructive border-destructive/20 flex items-center justify-center gap-2 border-b px-4 py-1.5 text-xs font-medium"
    >
      <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
      <span>
        {label} — os dados daqui são de teste e podem ser apagados a qualquer momento.
      </span>
    </div>
  );
}
