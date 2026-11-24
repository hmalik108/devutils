"use client";

import { useEffect, useState } from "react";

/** Debounce a value. Pass primitives or memoised objects — a new object each render would never settle. */
export function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
