import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * The sidebar already hides the settings link for roles that cannot manage it;
 * this is what someone typing the URL by hand lands on.
 */
export function AccessDeniedCard() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShieldAlert className="size-5" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">Você não tem permissão para acessar esta área.</p>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            As configurações do sistema são restritas a administradores. Fale com um administrador
            da congregação se precisar de acesso.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">Voltar ao dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
