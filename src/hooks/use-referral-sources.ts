"use client";

import { createCachedList } from "@/hooks/use-cached-list";
import { listReferralSources } from "@/lib/api/domain";
import type { ReferralSource } from "@/types/api";

/** Active sources only: a retired source must not show up in a picker. */
const store = createCachedList<ReferralSource>(() => listReferralSources());

export const useReferralSources = store.useList;

/** Called by Configurações after a source is created, edited or removed. */
export const refreshReferralSources = store.refresh;
