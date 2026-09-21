"use client";

import { Crown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Department } from "@/types/api";

export interface DepartmentSelection {
  departmentId: string;
  leader: boolean;
}

interface MemberDepartmentsFieldProps {
  departments: Department[];
  loading: boolean;
  value: DepartmentSelection[];
  onChange: (value: DepartmentSelection[]) => void;
  disabled?: boolean;
}

/**
 * Seleção de departamentos com a marcação de liderança embutida.
 *
 * O botão "Líder" só aparece depois que o departamento é marcado, e não ao lado
 * de todos: oferecer liderança de algo em que a pessoa não está é oferecer um
 * estado que o modelo não representa — a liderança mora na LIGAÇÃO entre membro
 * e departamento, então sem vínculo não há o que liderar.
 */
export function MemberDepartmentsField({
  departments,
  loading,
  value,
  onChange,
  disabled = false,
}: MemberDepartmentsFieldProps) {
  const selectedById = new Map(value.map((item) => [item.departmentId, item]));

  function toggle(departmentId: string, checked: boolean) {
    if (checked) {
      onChange([...value, { departmentId, leader: false }]);
      return;
    }
    // Desmarcar descarta a liderança junto, e é o certo: guardar "líder" de um
    // departamento do qual a pessoa saiu ressuscitaria o cargo se ela voltasse.
    onChange(value.filter((item) => item.departmentId !== departmentId));
  }

  function toggleLeader(departmentId: string) {
    onChange(
      value.map((item) =>
        item.departmentId === departmentId ? { ...item, leader: !item.leader } : item,
      ),
    );
  }

  if (loading) {
    return (
      <div className="space-y-2 rounded-lg border p-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-5 w-3/5" />
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
        Nenhum departamento cadastrado. Crie-os em Configurações → Departamentos.
      </p>
    );
  }

  return (
    <div className="divide-y rounded-lg border">
      {departments.map((department) => {
        const selected = selectedById.get(department.id);
        const isSelected = selected !== undefined;
        const checkboxId = `member-department-${department.id}`;

        return (
          <div key={department.id} className="flex items-center gap-3 px-3 py-2">
            <Checkbox
              id={checkboxId}
              checked={isSelected}
              onCheckedChange={(checked) => toggle(department.id, checked === true)}
              disabled={disabled}
            />
            <Label htmlFor={checkboxId} className="flex-1 cursor-pointer font-normal">
              {department.name}
            </Label>

            {isSelected ? (
              <Button
                type="button"
                variant={selected.leader ? "secondary" : "ghost"}
                size="sm"
                disabled={disabled}
                onClick={() => toggleLeader(department.id)}
                aria-pressed={selected.leader}
                aria-label={
                  selected.leader
                    ? `Deixar de marcar como líder de ${department.name}`
                    : `Marcar como líder de ${department.name}`
                }
                className={cn("h-7 gap-1.5 px-2", !selected.leader && "text-muted-foreground")}
              >
                <Crown className="size-3.5" aria-hidden="true" />
                Líder
              </Button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/** Os departamentos do membro, como badges. Usado na listagem e no detalhe. */
export function MemberDepartmentBadges({
  departments,
  className,
}: {
  departments: Array<{ id: string; name: string; leader: boolean }>;
  className?: string;
}) {
  if (departments.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {departments.map((department) => (
        <Badge key={department.id} variant={department.leader ? "secondary" : "outline"}>
          {department.leader ? (
            <Crown className="size-3" aria-label="Líder" />
          ) : null}
          {department.name}
        </Badge>
      ))}
    </div>
  );
}
