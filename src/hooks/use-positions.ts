"use client";

import { createCachedList } from "@/hooks/use-cached-list";
import { listPositions } from "@/lib/api/domain";
import type { Position } from "@/types/api";

/** Só os ativos: um cargo aposentado não pode aparecer num seletor. */
const store = createCachedList<Position>("positions", () => listPositions());

export const usePositions = store.useList;

/** Chamado por Configurações depois de criar, editar ou remover um cargo. */
export const refreshPositions = store.refresh;
