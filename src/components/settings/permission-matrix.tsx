"use client";

import { Eye, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import type { PermissionArea } from "@/types/api";

interface PermissionMatrixProps {
  areas: PermissionArea[];
  loading: boolean;
  /** Conjunto atual. Sempre completo — "gerenciar" acompanhado de "ver". */
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

const view = (key: string) => `${key}:view`;
const manage = (key: string) => `${key}:manage`;

/**
 * A matriz de permissões: uma linha por tela, uma coluna para ver e outra para
 * editar.
 *
 * As áreas vêm do SERVIDOR, não de uma lista aqui. As telas existem no código da
 * API, e manter uma segunda lista no front garantiria que uma das duas ficaria
 * desatualizada — provavelmente esta, que é a que ninguém lembra de abrir quando
 * acrescenta um endpoint.
 */
export function PermissionMatrix({
  areas,
  loading,
  value,
  onChange,
  disabled = false,
}: PermissionMatrixProps) {
  const granted = new Set(value);

  function toggleView(area: PermissionArea, checked: boolean) {
    const next = new Set(granted);
    if (checked) {
      next.add(view(area.key));
    } else {
      // Tirar "ver" tira "gerenciar" junto: editar uma tela que não se enxerga
      // é um estado que o servidor não representa — lá, gerenciar implica ver.
      // Permitir marcar aqui mostraria uma configuração que seria desfeita ao
      // salvar, e ninguém entenderia por quê.
      next.delete(view(area.key));
      next.delete(manage(area.key));
    }
    onChange([...next]);
  }

  function toggleManage(area: PermissionArea, checked: boolean) {
    const next = new Set(granted);
    if (checked) {
      next.add(manage(area.key));
      next.add(view(area.key));
    } else {
      next.delete(manage(area.key));
    }
    onChange([...next]);
  }

  function setAll(enabled: boolean) {
    if (!enabled) {
      onChange([]);
      return;
    }
    const all: string[] = [];
    for (const area of areas) {
      all.push(view(area.key));
      if (area.manageable) all.push(manage(area.key));
    }
    onChange(all);
  }

  if (loading) {
    return (
      <div className="space-y-2 rounded-lg border p-3">
        {[0, 1, 2, 3].map((row) => (
          <Skeleton key={row} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          Marque o que este nível enxerga e o que ele pode alterar.
        </p>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={disabled}
            onClick={() => setAll(true)}
          >
            Marcar tudo
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={disabled}
            onClick={() => setAll(false)}
          >
            Limpar
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="bg-muted/50 text-muted-foreground flex items-center gap-3 border-b px-3 py-2 text-xs font-medium">
          <span className="flex-1">Tela</span>
          <span className="flex w-14 items-center justify-center gap-1">
            <Eye className="size-3.5" aria-hidden="true" />
            Ver
          </span>
          <span className="flex w-16 items-center justify-center gap-1">
            <Pencil className="size-3.5" aria-hidden="true" />
            Editar
          </span>
        </div>

        <div className="divide-y">
          {areas.map((area) => {
            const canView = granted.has(view(area.key));
            const canManage = granted.has(manage(area.key));

            return (
              <div key={area.key} className="flex items-center gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{area.label}</p>
                  <p className="text-muted-foreground text-xs text-pretty">{area.description}</p>
                </div>

                <span className="flex w-14 justify-center">
                  <Checkbox
                    checked={canView}
                    onCheckedChange={(checked) => toggleView(area, checked === true)}
                    disabled={disabled}
                    aria-label={`Ver ${area.label}`}
                  />
                </span>

                <span className="flex w-16 justify-center">
                  {area.manageable ? (
                    <Checkbox
                      checked={canManage}
                      onCheckedChange={(checked) => toggleManage(area, checked === true)}
                      disabled={disabled}
                      aria-label={`Editar ${area.label}`}
                    />
                  ) : (
                    // Dashboard e Métricas não têm o que gerenciar. Um traço diz
                    // isso; uma caixa desabilitada pareceria permissão negada.
                    <span className="text-muted-foreground text-sm" aria-hidden="true">
                      —
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
