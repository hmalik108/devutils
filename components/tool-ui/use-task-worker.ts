"use client";

import { useEffect, useRef } from "react";
import { TaskWorker } from "@/lib/worker-client";

/** Lazily create a TaskWorker on first use and terminate it on unmount. */
export function useTaskWorker<Req extends object, Res>(factory: () => Worker, timeoutMs: number) {
  const ref = useRef<TaskWorker<Req, Res> | null>(null);
  useEffect(() => () => ref.current?.dispose(), []);
  return () => {
    if (!ref.current) ref.current = new TaskWorker<Req, Res>(factory, timeoutMs);
    return ref.current;
  };
}
