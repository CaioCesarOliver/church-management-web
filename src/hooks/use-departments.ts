"use client";

import { createCachedList } from "@/hooks/use-cached-list";
import { listDepartments } from "@/lib/api/domain";
import type { Department } from "@/types/api";

/** Só os ativos: um departamento aposentado não pode aparecer num seletor. */
const store = createCachedList<Department>("departments", () => listDepartments());

export const useDepartments = store.useList;

/** Chamado por Configurações depois de criar, editar ou remover um departamento. */
export const refreshDepartments = store.refresh;
