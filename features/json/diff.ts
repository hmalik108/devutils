import { pathSegment } from "./format";

export type DiffKind = "added" | "removed" | "changed";

export interface DiffEntry {
  kind: DiffKind;
  /** JS-style path, e.g. `user.tags[2]`. `$` is the document root. */
  path: string;
  left?: unknown;
  right?: unknown;
}

export interface DiffOptions {
  /** Stop after this many differences (protects the UI on huge inputs). */
  limit?: number;
}

function typeOf(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}

/**
 * Structural diff of two parsed JSON values. Key order and formatting are
 * irrelevant; arrays are compared by index.
 */
export function diffJson(left: unknown, right: unknown, opts: DiffOptions = {}): { entries: DiffEntry[]; truncated: boolean } {
  const limit = opts.limit ?? 5000;
  const entries: DiffEntry[] = [];
  let truncated = false;

  const push = (e: DiffEntry) => {
    if (entries.length >= limit) {
      truncated = true;
      return false;
    }
    entries.push(e);
    return true;
  };

  const walk = (a: unknown, b: unknown, path: string): boolean => {
    const p = path === "" ? "$" : path;
    const ta = typeOf(a);
    const tb = typeOf(b);
    if (ta !== tb) return push({ kind: "changed", path: p, left: a, right: b });

    if (ta === "array") {
      const aa = a as unknown[];
      const bb = b as unknown[];
      const n = Math.max(aa.length, bb.length);
      for (let i = 0; i < n; i++) {
        const sub = path + pathSegment(i, path === "");
        const ok =
          i >= aa.length
            ? push({ kind: "added", path: sub, right: bb[i] })
            : i >= bb.length
              ? push({ kind: "removed", path: sub, left: aa[i] })
              : walk(aa[i], bb[i], sub);
        if (!ok) return false;
      }
      return true;
    }

    if (ta === "object") {
      const ao = a as Record<string, unknown>;
      const bo = b as Record<string, unknown>;
      const keys = new Set([...Object.keys(ao), ...Object.keys(bo)]);
      for (const k of keys) {
        const sub = path + pathSegment(k, path === "");
        const inA = Object.prototype.hasOwnProperty.call(ao, k);
        const inB = Object.prototype.hasOwnProperty.call(bo, k);
        const ok = !inB
          ? push({ kind: "removed", path: sub, left: ao[k] })
          : !inA
            ? push({ kind: "added", path: sub, right: bo[k] })
            : walk(ao[k], bo[k], sub);
        if (!ok) return false;
      }
      return true;
    }

    if (!Object.is(a, b) && a !== b) return push({ kind: "changed", path: p, left: a, right: b });
    return true;
  };

  walk(left, right, "");
  return { entries, truncated };
}

export function summarize(entries: DiffEntry[]) {
  return {
    added: entries.filter((e) => e.kind === "added").length,
    removed: entries.filter((e) => e.kind === "removed").length,
    changed: entries.filter((e) => e.kind === "changed").length,
  };
}

const show = (v: unknown) => JSON.stringify(v);

/** Plain-text report suitable for copying or downloading. */
export function diffToText(entries: DiffEntry[]): string {
  if (entries.length === 0) return "No differences — the documents are equivalent.";
  return entries
    .map((e) =>
      e.kind === "added"
        ? `+ ${e.path}: ${show(e.right)}`
        : e.kind === "removed"
          ? `- ${e.path}: ${show(e.left)}`
          : `~ ${e.path}: ${show(e.left)} → ${show(e.right)}`,
    )
    .join("\n");
}
