"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Current time in ms, refreshed every `intervalMs`. Returns null during SSR and
 * hydration so server and client markup match.
 */
export function useNow(intervalMs = 1000): number | null {
  const subscribe = useCallback(
    (cb: () => void) => {
      const t = setInterval(cb, intervalMs);
      return () => clearInterval(t);
    },
    [intervalMs],
  );
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
    () => null,
  );
}
