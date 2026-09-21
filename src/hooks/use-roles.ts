"use client";

import { createCachedList } from "@/hooks/use-cached-list";
import { listRoles } from "@/lib/api/roles";
import type { Role } from "@/types/api";

/** Só os ativos: um nível aposentado não pode aparecer no formulário de usuário. */
const store = createCachedList<Role>(() => listRoles());

export const useRoles = store.useList;

/** Chamado pela tela de permissionamento após criar, editar ou remover. */
export const refreshRoles = store.refresh;
