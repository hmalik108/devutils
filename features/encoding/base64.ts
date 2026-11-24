export type Result = { ok: true; value: string } | { ok: false; error: string };

function bytesToBinary(bytes: Uint8Array): string {
  // Chunk to avoid "Maximum call stack size exceeded" on large inputs.
  let s = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK) as unknown as number[]);
  }
  return s;
}

export function bytesToBase64(bytes: Uint8Array, urlSafe = false): string {
  const b64 = btoa(bytesToBinary(bytes));
  return urlSafe ? b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : b64;
}

/** Encode text as UTF-8, then Base64. */
export function encodeBase64(text: string, urlSafe = false): string {
  return bytesToBase64(new TextEncoder().encode(text), urlSafe);
}

/**
 * Decode Base64 (standard or URL-safe, padding optional, whitespace ignored)
 * to raw bytes. Returns an error message for invalid input.
 */
export function base64ToBytes(input: string): { ok: true; value: Uint8Array } | { ok: false; error: string } {
  const cleaned = input.replace(/\s+/g, "");
  if (cleaned === "") return { ok: false, error: "Input is empty." };
  const bad = /[^A-Za-z0-9+/=_-]/.exec(cleaned);
  if (bad) return { ok: false, error: `Invalid character "${bad[0]}" at position ${bad.index + 1}. Base64 uses A–Z, a–z, 0–9, +, / (or -, _ for URL-safe) and = padding.` };
  if (/[+/]/.test(cleaned) && /[-_]/.test(cleaned))
    return { ok: false, error: "Input mixes standard (+ /) and URL-safe (- _) Base64 alphabets." };
  const firstPad = cleaned.indexOf("=");
  if (firstPad !== -1 && !/^=+$/.test(cleaned.slice(firstPad)))
    return { ok: false, error: "Padding (=) may only appear at the end." };
  let std = cleaned.replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, "");
  if (std.length % 4 === 1) return { ok: false, error: "Invalid length: Base64 input cannot have 4n+1 characters." };
  std += "=".repeat((4 - (std.length % 4)) % 4);
  try {
    const bin = atob(std);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { ok: true, value: bytes };
  } catch {
    return { ok: false, error: "Input is not valid Base64." };
  }
}

/** Decode Base64 to UTF-8 text. Fails clearly if the bytes are not valid UTF-8 text. */
export function decodeBase64(input: string): Result {
  const r = base64ToBytes(input);
  if (!r.ok) return r;
  try {
    return { ok: true, value: new TextDecoder("utf-8", { fatal: true }).decode(r.value) };
  } catch {
    return { ok: false, error: "Decoded data is not valid UTF-8 text (it may be binary data such as an image or compressed file)." };
  }
}
