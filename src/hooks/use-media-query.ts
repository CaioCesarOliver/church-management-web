"use client";

import { useEffect, useState } from "react";

/**
 * Returns whether a CSS media query currently matches.
 *
 * Starts as `false` on the server and on the first client render, then settles
 * after mount — so anything that swaps STRUCTURE based on it (a popover on
 * desktop versus a bottom sheet on a phone) renders the same markup on both
 * sides and never trips hydration.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const list = window.matchMedia(query);
    setMatches(list.matches);

    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** Tailwind's `sm` breakpoint. Below it, use touch-friendly presentation. */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 640px)");
}
