/// <reference lib="webworker" />
import { runRegex } from "./regex";

export interface RegexWorkerRequest {
  id: number;
  pattern: string;
  flags: string;
  text: string;
}

self.onmessage = (e: MessageEvent<RegexWorkerRequest>) => {
  const { id, pattern, flags, text } = e.data;
  const result = runRegex(pattern, flags, text);
  (self as unknown as Worker).postMessage({ id, result });
};
