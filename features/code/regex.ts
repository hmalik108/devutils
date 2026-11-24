export interface RegexMatch {
  index: number;
  end: number;
  text: string;
  groups: (string | undefined)[];
  named?: Record<string, string | undefined>;
}

export type RegexRunResult =
  | { ok: true; matches: RegexMatch[]; truncated: boolean; flags: string }
  | { ok: false; error: string };

export const ALLOWED_FLAGS = ["g", "i", "m", "s", "u", "v", "y", "d"] as const;
export const MAX_MATCHES = 10_000;

export function compileRegex(pattern: string, flags: string): { ok: true; re: RegExp } | { ok: false; error: string } {
  const bad = [...flags].find((f) => !(ALLOWED_FLAGS as readonly string[]).includes(f));
  if (bad) return { ok: false, error: `Unknown flag "${bad}".` };
  if (flags.includes("u") && flags.includes("v")) return { ok: false, error: 'Flags "u" and "v" cannot be combined.' };
  try {
    return { ok: true, re: new RegExp(pattern, flags) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg.replace(/^Invalid regular expression:\s*/i, "") };
  }
}

/**
 * Run a regex over text. Without the "g" flag only the first match is returned,
 * mirroring String.prototype.match semantics. Must be run in a Web Worker in the
 * UI so a catastrophic-backtracking pattern can be terminated.
 */
export function runRegex(pattern: string, flags: string, text: string, maxMatches = MAX_MATCHES): RegexRunResult {
  if (pattern === "") return { ok: true, matches: [], truncated: false, flags };
  const c = compileRegex(pattern, flags);
  if (!c.ok) return c;
  const re = c.re;
  const matches: RegexMatch[] = [];
  const toMatch = (m: RegExpExecArray): RegexMatch => ({
    index: m.index,
    end: m.index + m[0].length,
    text: m[0],
    groups: m.slice(1),
    named: m.groups ? { ...m.groups } : undefined,
  });

  if (!re.global && !re.sticky) {
    const m = re.exec(text);
    if (m) matches.push(toMatch(m));
    return { ok: true, matches, truncated: false, flags };
  }

  const unicode = re.unicode || re.unicodeSets;
  let truncated = false;
  let m: RegExpExecArray | null;
  re.lastIndex = 0;
  while ((m = re.exec(text)) !== null) {
    if (matches.length >= maxMatches) {
      truncated = true;
      break;
    }
    matches.push(toMatch(m));
    if (m[0].length === 0) {
      // Avoid an infinite loop on empty matches; step over a full code point in unicode mode.
      const cp = unicode ? text.codePointAt(re.lastIndex) : undefined;
      re.lastIndex += cp !== undefined && cp > 0xffff ? 2 : 1;
    }
    if (!re.global) break; // sticky without global: single match
  }
  return { ok: true, matches, truncated, flags };
}

export interface Segment {
  text: string;
  match?: number;
}

/** Split text into plain and matched segments for safe (non-HTML) highlighting. */
export function segmentText(text: string, matches: RegexMatch[]): Segment[] {
  const out: Segment[] = [];
  let pos = 0;
  matches.forEach((m, i) => {
    if (m.end === m.index) return; // empty matches have nothing to highlight
    if (m.index > pos) out.push({ text: text.slice(pos, m.index) });
    out.push({ text: text.slice(m.index, m.end), match: i });
    pos = m.end;
  });
  if (pos < text.length) out.push({ text: text.slice(pos) });
  return out;
}

export const SAMPLE_PATTERNS: { name: string; pattern: string; flags: string; sample: string }[] = [
  { name: "Email address", pattern: String.raw`[\w.+-]+@[\w-]+\.[\w.-]+`, flags: "gi", sample: "Contact alice@example.com or bob.smith+dev@mail.example.org." },
  { name: "ISO date (named groups)", pattern: String.raw`(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})`, flags: "g", sample: "Released 2026-11-23, patched 2026-12-01." },
  { name: "IPv4 address", pattern: String.raw`\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b`, flags: "g", sample: "Gateway 192.168.1.1, DNS 8.8.8.8, invalid 999.1.1.1" },
  { name: "Hex color", pattern: String.raw`#(?:[0-9a-f]{3}){1,2}\b`, flags: "gi", sample: "color: #fff; background: #1E293B; border: #12;" },
  { name: "URL", pattern: String.raw`https?:\/\/[^\s/$.?#].[^\s]*`, flags: "gi", sample: "Docs at https://devutils.info/regex-tester and http://example.com/a?b=c" },
  { name: "Semantic version", pattern: String.raw`\bv?(\d+)\.(\d+)\.(\d+)(?:-[\w.]+)?\b`, flags: "g", sample: "Upgrade from v1.4.2 to 2.0.0-beta.1" },
];
