import { locateJsonError } from "./locate-error";

export type JsonResult<T = string> = { ok: true; value: T } | { ok: false; error: JsonParseError };

export interface JsonParseError {
  message: string;
  /** 1-based line, when the engine reports a location. */
  line?: number;
  /** 1-based column. */
  column?: number;
}

/** Convert a 0-based offset into 1-based line/column. */
export function offsetToLineCol(text: string, offset: number): { line: number; column: number } {
  let line = 1;
  let lastNl = -1;
  const end = Math.min(offset, text.length);
  for (let i = 0; i < end; i++) {
    if (text.charCodeAt(i) === 10) {
      line++;
      lastNl = i;
    }
  }
  return { line, column: end - lastNl };
}

/**
 * Build a consistent error for invalid JSON. Our own locator gives the same
 * message and position in every browser; engine messages are a fallback.
 */
export function describeJsonError(text: string, err: unknown): JsonParseError {
  if (text.trim() === "") return { message: "Input is empty." };
  const located = locateJsonError(text);
  if (located) return { message: located.message, ...offsetToLineCol(text, located.offset) };

  const raw = err instanceof Error ? err.message : String(err);
  const lc = /line (\d+) column (\d+)/i.exec(raw);
  const pos = /position (\d+)/i.exec(raw);
  const where = lc ? { line: Number(lc[1]), column: Number(lc[2]) } : pos ? offsetToLineCol(text, Number(pos[1])) : {};
  const message = raw.replace(/^JSON\.parse:\s*/i, "").replace(/\s+(in JSON )?at (position|line).*$/i, "").trim() || "Invalid JSON";
  return { message: message.charAt(0).toUpperCase() + message.slice(1), ...where };
}

export function parseJson(text: string): JsonResult<unknown> {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    return { ok: false, error: describeJsonError(text, e) };
  }
}

export type Indent = 2 | 4 | "tab";

export function formatJson(text: string, indent: Indent = 2, sortKeys = false): JsonResult {
  const parsed = parseJson(text);
  if (!parsed.ok) return parsed;
  const value = sortKeys ? sortDeep(parsed.value) : parsed.value;
  return { ok: true, value: JSON.stringify(value, null, indent === "tab" ? "\t" : indent) };
}

export function minifyJson(text: string): JsonResult {
  const parsed = parseJson(text);
  if (!parsed.ok) return parsed;
  return { ok: true, value: JSON.stringify(parsed.value) };
}

export function validateJson(text: string): { valid: true } | { valid: false; error: JsonParseError } {
  const parsed = parseJson(text);
  return parsed.ok ? { valid: true } : { valid: false, error: parsed.error };
}

function sortDeep(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortDeep);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v).sort()) out[k] = sortDeep((v as Record<string, unknown>)[k]);
    return out;
  }
  return v;
}

const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** Build a JS-style path segment: `.key`, `["odd key"]` or `[0]`. */
export function pathSegment(key: string | number, isRoot: boolean): string {
  if (typeof key === "number") return `[${key}]`;
  if (IDENT.test(key)) return isRoot ? key : `.${key}`;
  return `[${JSON.stringify(key)}]`;
}

/**
 * Flatten nested JSON into a single-level object whose keys are paths
 * (`a.b[0].c`). Empty objects/arrays are kept as leaves so no data is lost.
 */
export function flattenValue(value: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const walk = (v: unknown, path: string) => {
    if (Array.isArray(v)) {
      if (v.length === 0) {
        out[path] = [];
        return;
      }
      v.forEach((item, i) => walk(item, path + pathSegment(i, path === "")));
    } else if (v && typeof v === "object") {
      const keys = Object.keys(v);
      if (keys.length === 0) {
        out[path] = {};
        return;
      }
      for (const k of keys) walk((v as Record<string, unknown>)[k], path + pathSegment(k, path === ""));
    } else {
      out[path === "" ? "$" : path] = v;
    }
  };
  walk(value, "");
  return out;
}

export function flattenJson(text: string, indent: Indent = 2): JsonResult {
  const parsed = parseJson(text);
  if (!parsed.ok) return parsed;
  return { ok: true, value: JSON.stringify(flattenValue(parsed.value), null, indent === "tab" ? "\t" : indent) };
}
