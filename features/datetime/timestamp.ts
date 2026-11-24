export type TimestampUnit = "seconds" | "milliseconds";

/** JS Date supports ±8.64e15 ms around the epoch. */
const MAX_MS = 8.64e15;

export interface ConvertedTime {
  ms: number;
  seconds: number;
  milliseconds: number;
  unit: TimestampUnit;
  /** True when the unit was inferred from the number of digits. */
  inferred: boolean;
  iso: string;
  utc: string;
  local: string;
  timeZone: string;
}

export type TsResult = { ok: true; value: ConvertedTime } | { ok: false; error: string };

/**
 * Infer the unit by magnitude: values with |n| >= 1e11 are treated as
 * milliseconds (1e11 seconds is the year 5138; 1e11 ms is 1973).
 */
export function inferUnit(n: number): TimestampUnit {
  return Math.abs(n) >= 1e11 ? "milliseconds" : "seconds";
}

export function localTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "local time";
  } catch {
    return "local time";
  }
}

export function formatUtc(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "short",
  }).format(d);
}

export function formatLocal(d: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "longOffset",
  }).format(d);
}

function build(ms: number, unit: TimestampUnit, inferred: boolean, timeZone?: string): TsResult {
  if (!Number.isFinite(ms) || Math.abs(ms) > MAX_MS) {
    return { ok: false, error: "Timestamp is outside the supported range (about ±275,000 years from 1970)." };
  }
  const d = new Date(ms);
  return {
    ok: true,
    value: {
      ms,
      seconds: Math.floor(ms / 1000),
      milliseconds: ms,
      unit,
      inferred,
      iso: d.toISOString(),
      utc: formatUtc(d),
      local: formatLocal(d, timeZone),
      timeZone: timeZone ?? localTimeZone(),
    },
  };
}

/** Parse a Unix timestamp string. `unit: "auto"` infers seconds vs milliseconds. */
export function fromTimestamp(input: string, unit: TimestampUnit | "auto" = "auto", timeZone?: string): TsResult {
  const s = input.trim().replace(/[_,\s]/g, "");
  if (s === "") return { ok: false, error: "Enter a Unix timestamp." };
  if (!/^-?\d+(\.\d+)?$/.test(s)) return { ok: false, error: "A Unix timestamp must be a number, e.g. 1700000000 or 1700000000000." };
  const n = Number(s);
  const resolved = unit === "auto" ? inferUnit(n) : unit;
  const ms = resolved === "seconds" ? n * 1000 : n;
  return build(Math.trunc(ms), resolved, unit === "auto", timeZone);
}

/**
 * Parse a date string. ISO 8601 with an offset or "Z" is absolute; strings
 * without an offset are interpreted in `assume` ("local" or "utc").
 */
export function fromDateString(input: string, assume: "local" | "utc" = "local", timeZone?: string): TsResult {
  const s = input.trim();
  if (s === "") return { ok: false, error: "Enter a date, e.g. 2026-11-23T14:30:00Z." };
  const isoNoZone = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3})\d*)?)?)?$/.exec(s);
  let ms: number;
  if (isoNoZone) {
    const [, y, mo, d, h = "0", mi = "0", se = "0", frac = "0"] = isoNoZone;
    const parts = [Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(se), Number(frac.padEnd(3, "0"))] as const;
    ms = assume === "utc" ? Date.UTC(...parts) : new Date(...parts).getTime();
    // Reject rollovers like 2026-02-31.
    const check = new Date(ms);
    const [cy, cm, cd] = assume === "utc" ? [check.getUTCFullYear(), check.getUTCMonth(), check.getUTCDate()] : [check.getFullYear(), check.getMonth(), check.getDate()];
    if (cy !== parts[0] || cm !== parts[1] || cd !== parts[2]) return { ok: false, error: "That calendar date does not exist." };
  } else {
    ms = Date.parse(s);
  }
  if (Number.isNaN(ms)) return { ok: false, error: "Could not parse that date. Use ISO 8601, e.g. 2026-11-23T14:30:00Z or 2026-11-23 14:30." };
  return build(ms, "seconds", false, timeZone);
}
