"use client";

import { createCachedList } from "@/hooks/use-cached-list";
import { listMeetingTypes } from "@/lib/api/domain";
import type { MeetingType } from "@/types/api";

/** Active types only: a retired type must not show up in a picker. */
const store = createCachedList<MeetingType>("meeting-types", () => listMeetingTypes());

export const useMeetingTypes = store.useList;

/** Called by Configurações after a type is created, edited or removed. */
export const refreshMeetingTypes = store.refresh;
