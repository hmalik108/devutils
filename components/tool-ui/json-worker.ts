"use client";

import type { JsonWorkerRequest } from "@/features/json/json.worker";

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
export type JsonTask = DistributiveOmit<JsonWorkerRequest, "id">;

export const createJsonWorker = () => new Worker(new URL("../../features/json/json.worker.ts", import.meta.url), { type: "module" });
