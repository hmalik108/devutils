import { base64ToBytes } from "../encoding/base64";

export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: unknown;
  signature: string;
  /** Raw base64url segments, for display. */
  parts: [string, string, string];
}

export type JwtResult = { ok: true; value: DecodedJwt } | { ok: false; error: string };

function decodeSegment(seg: string, name: string): { ok: true; value: unknown } | { ok: false; error: string } {
  if (seg === "") return { ok: false, error: `The ${name} segment is empty.` };
  if (/[+/=]/.test(seg)) return { ok: false, error: `The ${name} contains characters (+ / =) that are not allowed in base64url.` };
  const bytes = base64ToBytes(seg);
  if (!bytes.ok) return { ok: false, error: `The ${name} is not valid base64url: ${bytes.error}` };
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes.value);
  } catch {
    return { ok: false, error: `The ${name} is not valid UTF-8.` };
  }
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, error: `The ${name} is not valid JSON.` };
  }
}

/**
 * Decode (NOT verify) a compact JWS. The signature is never checked — this
 * only reveals what the token claims.
 */
export function decodeJwt(token: string): JwtResult {
  const t = token.trim().replace(/^Bearer\s+/i, "");
  if (t === "") return { ok: false, error: "Paste a JWT to decode." };
  const parts = t.split(".");
  if (parts.length === 5)
    return { ok: false, error: "This looks like an encrypted JWE (5 segments). Its payload cannot be read without the decryption key." };
  if (parts.length !== 3)
    return { ok: false, error: `A JWT has 3 dot-separated segments (header.payload.signature); found ${parts.length}.` };
  const h = decodeSegment(parts[0], "header");
  if (!h.ok) return h;
  if (!h.value || typeof h.value !== "object" || Array.isArray(h.value))
    return { ok: false, error: "The header must be a JSON object." };
  const p = decodeSegment(parts[1], "payload");
  if (!p.ok) return p;
  return {
    ok: true,
    value: { header: h.value as Record<string, unknown>, payload: p.value, signature: parts[2], parts: parts as [string, string, string] },
  };
}

export interface TimeClaim {
  claim: "exp" | "iat" | "nbf";
  label: string;
  seconds: number;
  date: Date;
}

export type TokenStatus =
  | { state: "valid-time"; message: string }
  | { state: "expired"; message: string }
  | { state: "not-yet-valid"; message: string }
  | { state: "no-expiry"; message: string };

const LABELS = { exp: "Expires", iat: "Issued at", nbf: "Not before" } as const;

export function timeClaims(payload: unknown): { claims: TimeClaim[]; invalid: string[] } {
  const claims: TimeClaim[] = [];
  const invalid: string[] = [];
  if (!payload || typeof payload !== "object") return { claims, invalid };
  for (const k of ["iat", "nbf", "exp"] as const) {
    const v = (payload as Record<string, unknown>)[k];
    if (v === undefined) continue;
    // RFC 7519 NumericDate: seconds since epoch (may be fractional).
    if (typeof v !== "number" || !Number.isFinite(v)) {
      invalid.push(`"${k}" should be a NumericDate (number of seconds), got ${JSON.stringify(v)}.`);
      continue;
    }
    const d = new Date(v * 1000);
    if (Number.isNaN(d.getTime())) {
      invalid.push(`"${k}" is out of range.`);
      continue;
    }
    claims.push({ claim: k, label: LABELS[k], seconds: v, date: d });
  }
  return { claims, invalid };
}

export function tokenStatus(payload: unknown, now: Date = new Date()): TokenStatus {
  const { claims } = timeClaims(payload);
  const exp = claims.find((c) => c.claim === "exp");
  const nbf = claims.find((c) => c.claim === "nbf");
  const t = now.getTime();
  if (exp && exp.date.getTime() <= t) return { state: "expired", message: `Expired ${relative(exp.date, now)}.` };
  if (nbf && nbf.date.getTime() > t) return { state: "not-yet-valid", message: `Not valid until ${relative(nbf.date, now)}.` };
  if (exp) return { state: "valid-time", message: `Expires ${relative(exp.date, now)}.` };
  return { state: "no-expiry", message: "No exp claim — this token does not expire by itself." };
}

export function relative(date: Date, now: Date = new Date()): string {
  const diff = Math.round((date.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(diff);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1],
  ];
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, s] of units) {
    if (abs >= s || unit === "second") return rtf.format(Math.trunc(diff / s), unit);
  }
  return "";
}
