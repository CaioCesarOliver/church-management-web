"use client";

import { useEffect, useState } from "react";

/**
 * Debounces a value so a search box does not fire one request per keystroke.
 * Returns the previous value until `delay` ms have passed without a change.
 */
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
