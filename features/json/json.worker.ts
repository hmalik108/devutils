/// <reference lib="webworker" />
import { formatJson, minifyJson, flattenJson, parseJson, type Indent } from "./format";
import { diffJson } from "./diff";

export type JsonWorkerRequest =
  | { id: number; op: "format"; text: string; indent: Indent; sortKeys: boolean }
  | { id: number; op: "minify"; text: string }
  | { id: number; op: "flatten"; text: string; indent: Indent }
  | { id: number; op: "diff"; left: string; right: string };

self.onmessage = (e: MessageEvent<JsonWorkerRequest>) => {
  const req = e.data;
  let result: unknown;
  switch (req.op) {
    case "format":
      result = formatJson(req.text, req.indent, req.sortKeys);
      break;
    case "minify":
      result = minifyJson(req.text);
      break;
    case "flatten":
      result = flattenJson(req.text, req.indent);
      break;
    case "diff": {
      const l = parseJson(req.left);
      const r = parseJson(req.right);
      result = l.ok && r.ok ? { ok: true, value: diffJson(l.value, r.value) } : { ok: false, left: l.ok ? null : l.error, right: r.ok ? null : r.error };
      break;
    }
  }
  (self as unknown as Worker).postMessage({ id: req.id, result });
};
