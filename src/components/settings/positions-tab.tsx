"use client";

import { BadgeCheck } from "lucide-react";
import { useCallback } from "react";

import { VocabularyTab, countCell } from "@/components/settings/vocabulary-tab";
import { refreshPositions } from "@/hooks/use-positions";
import {
  createPosition,
  deletePosition,
  listPositions,
  reorderPositions,
  updatePosition,
} from "@/lib/api/domain";
import { formatNumber } from "@/lib/format";
import type { Position } from "@/types/api";

/** Cargo eclesiástico: o que a pessoa É na igreja. Um por membro. */
export function PositionsTab({ readOnly = false }: { readOnly?: boolean }) {
  // Os inativos são administrados aqui, então precisam aparecer aqui.
  const list = useCallback(() => listPositions({ includeInactive: true }), []);

  return (
    <VocabularyTab<Position>
      readOnly={readOnly}
      icon={BadgeCheck}
      description="O cargo é a posição ministerial da pessoa — pastor, presbítero, diácono. Cada membro tem no máximo um."
      emptyTitle="Nenhum cargo cadastrado"
      emptyDescription="Sem cargos, o formulário de membro não oferece nenhuma posição ministerial para escolher."
      createButtonLabel="Novo cargo"
      errorTitle="Não foi possível carregar os cargos"
      deleteTitle="Remover cargo"
      deleteDescription={(position) => (
        <>
          <strong className="text-foreground">{position.name}</strong> deixará de aparecer no
          cadastro de membros. Esta ação não pode ser desfeita.
        </>
      )}
      copy={{
        noun: "cargo",
        createTitle: "Novo cargo",
        editTitle: "Editar cargo",
        createDescription: "Informe a posição ministerial, como pastor ou diácono.",
        editDescription: "Atualize o nome e a situação deste cargo.",
        namePlaceholder: "Presbítero",
        inactiveHint:
          "Um cargo inativo some do cadastro de membros, mas quem já o exerce continua com ele.",
        createSubmitLabel: "Criar cargo",
      }}
      usageCount={(position) => position.memberCount ?? 0}
      usageColumn={{
        header: "Membros",
        width: "w-[110px]",
        cell: (position) => countCell(position.memberCount ?? 0),
      }}
      blockedHint={(position) =>
        `${formatNumber(position.memberCount ?? 0)} membro(s) exercem este cargo. Desative-o em vez de removê-lo.`
      }
      list={list}
      create={createPosition}
      update={updatePosition}
      remove={deletePosition}
      onChanged={refreshPositions}
      reorder={reorderPositions}
    />
  );
}
