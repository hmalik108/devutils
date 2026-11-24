export type Result = { ok: true; value: string } | { ok: false; error: string };

export type UrlMode = "component" | "uri";

/**
 * - "component": encodeURIComponent — for a single query value or path segment.
 *   Reserved characters such as / ? & = # are escaped.
 * - "uri": encodeURI — for a whole URL; reserved characters are kept.
 */
export function encodeUrl(text: string, mode: UrlMode = "component"): Result {
  try {
    return { ok: true, value: mode === "component" ? encodeURIComponent(text) : encodeURI(text) };
  } catch {
    // Only thrown for lone UTF-16 surrogates.
    return { ok: false, error: "Input contains an unpaired Unicode surrogate and cannot be encoded as UTF-8." };
  }
}

/** Locate the first malformed percent-escape to give a precise error. */
function findMalformed(text: string): string | null {
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== "%") continue;
    const hex = text.slice(i + 1, i + 3);
    if (!/^[0-9a-fA-F]{2}$/.test(hex)) return `Malformed escape "${text.slice(i, i + 3)}" at position ${i + 1}: "%" must be followed by two hex digits.`;
  }
  return null;
}

export function decodeUrl(text: string, opts: { mode?: UrlMode; plusAsSpace?: boolean } = {}): Result {
  const input = opts.plusAsSpace ? text.replace(/\+/g, " ") : text;
  const malformed = findMalformed(input);
  if (malformed) return { ok: false, error: malformed };
  try {
    return { ok: true, value: opts.mode === "uri" ? decodeURI(input) : decodeURIComponent(input) };
  } catch {
    return { ok: false, error: "Percent-escapes do not form valid UTF-8 (e.g. %E0%A4 is an incomplete multi-byte sequence)." };
  }
}
