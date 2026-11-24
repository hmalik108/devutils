/**
 * UUID v4 generation using the platform CSPRNG only. Math.random() is never used.
 */
export function uuidv4(): string {
  const c = globalThis.crypto;
  if (!c?.getRandomValues) throw new Error("A cryptographically secure random generator is not available in this browser.");
  if (typeof c.randomUUID === "function") return c.randomUUID();
  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // RFC 9562 variant (10xx)
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0"));
  return `${h.slice(0, 4).join("")}-${h.slice(4, 6).join("")}-${h.slice(6, 8).join("")}-${h.slice(8, 10).join("")}-${h.slice(10).join("")}`;
}

export const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const MAX_UUIDS = 1000;

export interface UuidOptions {
  uppercase?: boolean;
  hyphens?: boolean;
  braces?: boolean;
}

export function formatUuid(u: string, o: UuidOptions = {}): string {
  let s = o.hyphens === false ? u.replace(/-/g, "") : u;
  if (o.uppercase) s = s.toUpperCase();
  if (o.braces) s = `{${s}}`;
  return s;
}

export function generateUuids(count: number, o: UuidOptions = {}): string[] {
  const n = Math.max(1, Math.min(MAX_UUIDS, Math.floor(count)));
  return Array.from({ length: n }, () => formatUuid(uuidv4(), o));
}
