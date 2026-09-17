import type { MemberStatus } from "@/types/api";

/** shadcn's Select rejects an empty string value, so "Todos" needs a sentinel. */
export const ALL_STATUS = "ALL";

export type StatusFilter = MemberStatus | typeof ALL_STATUS;

export type MemberSort = "name" | "recent" | "attendance";

export const MEMBER_SORT_OPTIONS: Array<{ value: MemberSort; label: string }> = [
  { value: "name", label: "Nome" },
  { value: "recent", label: "Mais recentes" },
  { value: "attendance", label: "Assiduidade" },
];

/**
 * The "ordenação" picker chooses the field; the API takes field + direction
 * separately, and `sortOrder` here is the direction that field starts in — a
 * click on the matching table header flips it from there.
 */
export const MEMBER_SORT_PARAMS: Record<
  MemberSort,
  { sortBy: "name" | "createdAt" | "attendanceRate"; sortOrder: "asc" | "desc" }
> = {
  name: { sortBy: "name", sortOrder: "asc" },
  recent: { sortBy: "createdAt", sortOrder: "desc" },
  attendance: { sortBy: "attendanceRate", sortOrder: "desc" },
};

/** Table column keys arrive as plain strings; only some of them are sort keys. */
export function isMemberSort(value: string): value is MemberSort {
  return value in MEMBER_SORT_PARAMS;
}
