"use client";

import { Network } from "lucide-react";
import { useCallback } from "react";

import { VocabularyTab, countCell } from "@/components/settings/vocabulary-tab";
import { refreshDepartments } from "@/hooks/use-departments";
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  reorderDepartments,
  updateDepartment,
} from "@/lib/api/domain";
import { formatNumber } from "@/lib/format";
import type { Department } from "@/types/api";

/** Departamento: onde a pessoa SERVE. Vários por membro, e a ligação diz quem lidera. */
export function DepartmentsTab({ readOnly = false }: { readOnly?: boolean }) {
  // Os inativos são administrados aqui, então precisam aparecer aqui.
  const list = useCallback(() => listDepartments({ includeInactive: true }), []);

  return (
    <VocabularyTab<Department>
      readOnly={readOnly}
      icon={Network}
      description="O departamento é onde a pessoa serve — louvor, jovens, infantil. Um membro pode estar em vários, e em cada um pode constar como líder."
      emptyTitle="Nenhum departamento cadastrado"
      emptyDescription="Sem departamentos, não há como registrar onde cada membro serve nem quem lidera cada frente."
      createButtonLabel="Novo departamento"
      errorTitle="Não foi possível carregar os departamentos"
      deleteTitle="Remover departamento"
      deleteDescription={(department) => (
        <>
          <strong className="text-foreground">{department.name}</strong> deixará de aparecer no
          cadastro de membros. Esta ação não pode ser desfeita.
        </>
      )}
      copy={{
        noun: "departamento",
        createTitle: "Novo departamento",
        editTitle: "Editar departamento",
        createDescription: "Informe a frente de serviço, como louvor ou infantil.",
        editDescription: "Atualize o nome e a situação deste departamento.",
        namePlaceholder: "Louvor",
        inactiveHint:
          "Um departamento inativo some do cadastro de membros, mas quem já serve nele continua vinculado.",
        createSubmitLabel: "Criar departamento",
      }}
      usageCount={(department) => department.memberCount ?? 0}
      usageColumn={{
        header: "Membros",
        width: "w-[110px]",
        cell: (department) => countCell(department.memberCount ?? 0),
      }}
      // Líderes é coluna separada, e não "3 (1 líder)" numa só: são duas
      // perguntas diferentes — quanta gente serve, e se a frente tem alguém
      // responsável. Um departamento com 12 pessoas e nenhum líder é uma
      // informação que se perde amontoada com o total.
      extraColumns={[
        {
          header: "Líderes",
          width: "w-[110px]",
          cell: (department) => countCell(department.leaderCount ?? 0),
        },
      ]}
      blockedHint={(department) =>
        `${formatNumber(department.memberCount ?? 0)} membro(s) servem neste departamento. Desative-o em vez de removê-lo.`
      }
      list={list}
      create={createDepartment}
      update={updateDepartment}
      remove={deleteDepartment}
      onChanged={refreshDepartments}
      reorder={reorderDepartments}
    />
  );
}
