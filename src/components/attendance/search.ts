/**
 * The roll call is typed live, in a hurry, usually on a phone keyboard with no
 * accents — "jose" has to find "José". Stripping the combining marks from both
 * sides makes the match accent-insensitive instead of demanding exact spelling.
 */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function matchesSearch(name: string, search: string): boolean {
  const term = normalizeText(search.trim());
  if (!term) return true;
  return normalizeText(name).includes(term);
}
