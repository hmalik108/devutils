import { byteLength, formatBytes } from "./utils";

/** Upper bound for text pasted into any tool. Keeps the tab responsive. */
export const MAX_INPUT_BYTES = 5 * 1024 * 1024;
/** Above this size, expensive work is moved to a Web Worker. */
export const WORKER_THRESHOLD_BYTES = 100 * 1024;
/** Max file size for the hash generator's file mode. */
export const MAX_FILE_BYTES = 200 * 1024 * 1024;

export function checkInputSize(input: string, max = MAX_INPUT_BYTES): string | null {
  // Fast path: a UTF-16 string can't exceed 3 bytes per code unit in UTF-8.
  if (input.length * 3 <= max) return null;
  const size = byteLength(input);
  return size > max ? `Input is ${formatBytes(size)}; the limit is ${formatBytes(max)}.` : null;
}
