"use client";

import { useCallback, useEffect, useState } from "react";

export interface CachedList<T> {
  items: T[];
  loading: boolean;
  error: unknown;
  /** Re-fetches and pushes the new list to every mounted consumer. */
  refresh: () => Promise<void>;
}

/**
 * Builds a hook over a small, rarely changing list (the congregation-owned
 * vocabularies). The result lives in a module-level store instead of component
 * state, so the list is fetched once and every picker on the screen reuses it —
 * a filter bar, a form dialog and a chart no longer trigger three requests.
 *
 * Deliberately not a cache library: there is none installed, and the only
 * invalidation this app needs is "Configurações just changed the list".
 */
export function createCachedList<T>(fetcher: () => Promise<T[]>): {
  useList: () => CachedList<T>;
  refresh: () => Promise<void>;
} {
  let data: T[] | null = null;
  let error: unknown = null;
  let inFlight: Promise<void> | null = null;
  const listeners = new Set<() => void>();

  function load(force: boolean): Promise<void> {
    if (!force) {
      if (inFlight) return inFlight;
      if (data !== null) return Promise.resolve();
    }

    const pending = fetcher()
      .then((items) => {
        data = items;
        error = null;
      })
      .catch((err: unknown) => {
        error = err;
      })
      .finally(() => {
        inFlight = null;
        for (const listener of listeners) listener();
      });

    inFlight = pending;
    return pending;
  }

  function useList(): CachedList<T> {
    const [, setVersion] = useState(0);

    useEffect(() => {
      const listener = () => setVersion((current) => current + 1);
      listeners.add(listener);
      void load(false);
      return () => {
        listeners.delete(listener);
      };
    }, []);

    const refresh = useCallback(() => load(true), []);

    return {
      items: data ?? [],
      loading: data === null && error === null,
      error,
      refresh,
    };
  }

  return { useList, refresh: () => load(true) };
}
