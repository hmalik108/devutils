/**
 * Standard 5-field cron (Vixie / POSIX crontab dialect):
 *
 *   ┌ minute (0–59)
 *   │ ┌ hour (0–23)
 *   │ │ ┌ day of month (1–31)
 *   │ │ │ ┌ month (1–12 or JAN–DEC)
 *   │ │ │ │ ┌ day of week (0–7 or SUN–SAT; 0 and 7 are Sunday)
 *   * * * * *
 *
 * Supported: `*`, numbers, names, lists (`a,b`), ranges (`a-b`), steps on `*`
 * and ranges (`*\/n`, `a-b/n`) and the macros @yearly @annually @monthly
 * @weekly @daily @midnight @hourly.
 * Not supported (non-standard extensions): seconds/year fields, `?`, `L`, `W`, `#`, `a/n`.
 *
 * Day-of-month and day-of-week follow Vixie semantics: if both are restricted
 * (neither starts with `*`), a day matches when EITHER matches.
 */

export interface FieldSpec {
  name: "minute" | "hour" | "dayOfMonth" | "month" | "dayOfWeek";
  label: string;
  min: number;
  max: number;
  names?: string[];
}

export const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
export const DOW_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
export const MONTH_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const DOW_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const FIELDS: FieldSpec[] = [
  { name: "minute", label: "Minute", min: 0, max: 59 },
  { name: "hour", label: "Hour", min: 0, max: 23 },
  { name: "dayOfMonth", label: "Day of month", min: 1, max: 31 },
  { name: "month", label: "Month", min: 1, max: 12, names: MONTH_NAMES },
  { name: "dayOfWeek", label: "Day of week", min: 0, max: 7, names: DOW_NAMES },
];

export const MACROS: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

export interface ParsedField {
  raw: string;
  values: number[];
  /** Field begins with `*` — relevant for the DOM/DOW rule. */
  star: boolean;
}

export interface ParsedCron {
  expression: string;
  fields: ParsedField[];
}

export type CronParseResult = { ok: true; value: ParsedCron } | { ok: false; error: string };

function parseValue(token: string, spec: FieldSpec): number | string {
  if (/^\d+$/.test(token)) {
    const n = Number(token);
    if (n < spec.min || n > spec.max) return `${spec.label} value ${n} is out of range (${spec.min}–${spec.max}).`;
    return n;
  }
  const idx = spec.names?.indexOf(token.toUpperCase()) ?? -1;
  if (idx >= 0) return spec.name === "month" ? idx + 1 : idx;
  return `"${token}" is not a valid ${spec.label.toLowerCase()} value.`;
}

export function parseField(raw: string, spec: FieldSpec): { ok: true; value: ParsedField } | { ok: false; error: string } {
  if (raw === "") return { ok: false, error: `${spec.label} is empty.` };
  if (/[?LW#]/i.test(raw) && !spec.names?.some((n) => raw.toUpperCase().includes(n)))
    return { ok: false, error: `${spec.label}: "?", "L", "W" and "#" are Quartz/AWS extensions, not standard cron.` };
  const set = new Set<number>();
  for (const part of raw.split(",")) {
    if (part === "") return { ok: false, error: `${spec.label}: empty item in list "${raw}".` };
    const [rangePart, stepPart, extra] = part.split("/");
    if (extra !== undefined) return { ok: false, error: `${spec.label}: "${part}" has more than one "/".` };
    let step = 1;
    if (stepPart !== undefined) {
      if (!/^\d+$/.test(stepPart) || Number(stepPart) === 0) return { ok: false, error: `${spec.label}: step "${stepPart}" must be a positive integer.` };
      step = Number(stepPart);
    }
    let lo: number, hi: number;
    if (rangePart === "*") {
      lo = spec.min;
      hi = spec.name === "dayOfWeek" ? 6 : spec.max;
    } else if (rangePart.includes("-")) {
      const [a, b, more] = rangePart.split("-");
      if (more !== undefined || a === "" || b === "") return { ok: false, error: `${spec.label}: "${rangePart}" is not a valid range.` };
      const va = parseValue(a, spec);
      if (typeof va === "string") return { ok: false, error: va };
      const vb = parseValue(b, spec);
      if (typeof vb === "string") return { ok: false, error: vb };
      if (va > vb) return { ok: false, error: `${spec.label}: range ${rangePart} runs backwards; wrap-around ranges are not standard cron.` };
      lo = va;
      hi = vb;
    } else {
      if (stepPart !== undefined)
        return { ok: false, error: `${spec.label}: "${part}" is a non-standard step; use "${rangePart}-${spec.name === "dayOfWeek" ? 6 : spec.max}/${stepPart}" instead.` };
      const v = parseValue(rangePart, spec);
      if (typeof v === "string") return { ok: false, error: v };
      lo = hi = v;
    }
    for (let i = lo; i <= hi; i += step) set.add(spec.name === "dayOfWeek" && i === 7 ? 0 : i);
  }
  return { ok: true, value: { raw, values: [...set].sort((a, b) => a - b), star: raw.startsWith("*") } };
}

export function parseCron(input: string): CronParseResult {
  let expr = input.trim().replace(/\s+/g, " ");
  if (expr === "") return { ok: false, error: "Enter a cron expression." };
  if (expr.startsWith("@")) {
    const m = MACROS[expr.toLowerCase()];
    if (expr.toLowerCase() === "@reboot") return { ok: false, error: "@reboot runs once at startup; it is not a time schedule." };
    if (!m) return { ok: false, error: `Unknown macro "${expr}".` };
    expr = m;
  }
  const parts = expr.split(" ");
  if (parts.length === 6) return { ok: false, error: "Found 6 fields. Standard cron has 5 (no seconds or year field)." };
  if (parts.length !== 5) return { ok: false, error: `Standard cron has 5 fields; found ${parts.length}.` };
  const fields: ParsedField[] = [];
  for (let i = 0; i < 5; i++) {
    const r = parseField(parts[i], FIELDS[i]);
    if (!r.ok) return r;
    fields.push(r.value);
  }
  return { ok: true, value: { expression: expr, fields } };
}

// ---------------------------------------------------------------------------
// Explanation
// ---------------------------------------------------------------------------

const pad2 = (n: number) => String(n).padStart(2, "0");
const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

function joinList(items: string[], conj = "and"): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${conj} ${items[items.length - 1]}`;
}

function nameOf(spec: FieldSpec, n: number): string {
  if (spec.name === "month") return MONTH_LONG[n - 1];
  if (spec.name === "dayOfWeek") return DOW_LONG[n % 7];
  return String(n);
}

/** Describe one field's raw text item by item. */
function describeItems(raw: string, spec: FieldSpec, unit: string): string {
  const items = raw.split(",").map((part) => {
    const [range, step] = part.split("/");
    const val = (t: string) => {
      const v = parseValue(t, spec);
      return typeof v === "number" ? nameOf(spec, v) : t;
    };
    if (range === "*") return step ? `every ${ordinal(Number(step))} ${unit}` : `every ${unit}`;
    if (range.includes("-")) {
      const [a, b] = range.split("-");
      return step ? `every ${ordinal(Number(step))} ${unit} from ${val(a)} through ${val(b)}` : `${val(a)} through ${val(b)}`;
    }
    return val(range);
  });
  return joinList(items);
}

export function explainCron(parsed: ParsedCron): string {
  const [mi, ho, dom, mon, dow] = parsed.fields;
  const parts: string[] = [];

  const simple = (f: ParsedField) => /^\d+(,\d+)*$/.test(f.raw);
  if (simple(mi) && simple(ho) && mi.values.length * ho.values.length <= 6) {
    const times = ho.values.flatMap((h) => mi.values.map((m) => `${pad2(h)}:${pad2(m)}`));
    parts.push(`At ${joinList(times)}`);
  } else {
    if (mi.raw === "*") parts.push("Every minute");
    else if (/^\*\/\d+$/.test(mi.raw)) parts.push(`Every ${mi.raw.slice(2)} minutes`);
    else parts.push(`At minute ${describeItems(mi.raw, FIELDS[0], "minute")}`);

    if (ho.raw === "*") {
      if (mi.raw !== "*" && !/^\*\//.test(mi.raw)) parts.push("of every hour");
    } else if (/^\*\/\d+$/.test(ho.raw)) parts.push(`past every ${ordinal(Number(ho.raw.slice(2)))} hour`);
    else if (simple(ho)) parts.push(`past hour ${joinList(ho.values.map((h) => pad2(h)))}`);
    else parts.push(`during hour ${describeItems(ho.raw, FIELDS[1], "hour")}`);
  }

  const domStr = dom.raw === "*" ? "" : `on day-of-month ${describeItems(dom.raw, FIELDS[2], "day")}`;
  const dowStr = dow.raw === "*" ? "" : `on ${describeItems(dow.raw, FIELDS[4], "day of the week")}`;
  if (domStr && dowStr) {
    parts.push(dom.star || dow.star ? `${domStr} ${dowStr.replace(/^on /, "if it is ")}` : `${domStr} or ${dowStr}`);
  } else if (domStr) parts.push(domStr);
  else if (dowStr) parts.push(dowStr);

  if (mon.raw !== "*") parts.push(`in ${describeItems(mon.raw, FIELDS[3], "month")}`);
  return parts.join(" ") + ".";
}

// ---------------------------------------------------------------------------
// Next run times
// ---------------------------------------------------------------------------

/**
 * Compute upcoming run times by scanning days (not minutes), so even sparse
 * schedules like "0 0 29 2 *" resolve quickly. `timeZone` is "local" (the
 * browser's zone) or "utc". DST transitions are handled the way the JS Date
 * API normalises local times; real cron daemons differ here, so the UI says so.
 */
export function nextRuns(parsed: ParsedCron, count = 5, from: Date = new Date(), timeZone: "local" | "utc" = "local"): Date[] {
  const [mi, ho, dom, mon, dow] = parsed.fields;
  const minutes = mi.values;
  const hours = ho.values;
  const months = new Set(mon.values);
  const doms = new Set(dom.values);
  const dows = new Set(dow.values);
  const domRestricted = !dom.star;
  const dowRestricted = !dow.star;
  const utc = timeZone === "utc";

  const start = new Date(from.getTime());
  start.setSeconds(0, 0);
  start.setTime(start.getTime() + 60_000);

  const get = (d: Date) =>
    utc
      ? { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), w: d.getUTCDay() }
      : { y: d.getFullYear(), m: d.getMonth(), d: d.getDate(), w: d.getDay() };
  const make = (y: number, m: number, d: number, h = 0, min = 0) =>
    utc ? new Date(Date.UTC(y, m, d, h, min)) : new Date(y, m, d, h, min);

  const out: Date[] = [];
  const s = get(start);
  let day = make(s.y, s.m, s.d);
  const MAX_DAYS = 366 * 28; // covers leap-day schedules and DOW/DOM coincidences
  for (let i = 0; i < MAX_DAYS && out.length < count; i++) {
    const c = get(day);
    const domOk = doms.has(c.d);
    const dowOk = dows.has(c.w);
    const dayOk = domRestricted && dowRestricted ? domOk || dowOk : domOk && dowOk;
    if (months.has(c.m + 1) && dayOk) {
      for (const h of hours) {
        for (const m of minutes) {
          const t = make(c.y, c.m, c.d, h, m);
          // Skip times that DST normalised onto a different hour/day.
          const tc = utc ? t.getUTCHours() : t.getHours();
          if (tc !== h) continue;
          if (t.getTime() >= start.getTime()) out.push(t);
          if (out.length >= count) break;
        }
        if (out.length >= count) break;
      }
    }
    day = make(c.y, c.m, c.d + 1);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Builder model
// ---------------------------------------------------------------------------

export type BuilderMode = "every" | "step" | "specific" | "range";

export interface BuilderField {
  mode: BuilderMode;
  step: number;
  values: number[];
  from: number;
  to: number;
}

export type BuilderState = Record<FieldSpec["name"], BuilderField>;

export function defaultBuilder(): BuilderState {
  return {
    minute: { mode: "specific", step: 15, values: [0], from: 0, to: 59 },
    hour: { mode: "every", step: 2, values: [9], from: 9, to: 17 },
    dayOfMonth: { mode: "every", step: 2, values: [1], from: 1, to: 15 },
    month: { mode: "every", step: 3, values: [1], from: 1, to: 12 },
    dayOfWeek: { mode: "every", step: 2, values: [1], from: 1, to: 5 },
  };
}

/** Turn one builder field into cron syntax, or an error that blocks generation. */
export function builderFieldToCron(f: BuilderField, spec: FieldSpec): { ok: true; value: string } | { ok: false; error: string } {
  const max = spec.name === "dayOfWeek" ? 6 : spec.max;
  const inRange = (n: number) => Number.isInteger(n) && n >= spec.min && n <= max;
  switch (f.mode) {
    case "every":
      return { ok: true, value: "*" };
    case "step":
      if (!Number.isInteger(f.step) || f.step < 1 || f.step > max)
        return { ok: false, error: `${spec.label}: interval must be between 1 and ${max}.` };
      return { ok: true, value: f.step === 1 ? "*" : `*/${f.step}` };
    case "specific": {
      if (f.values.length === 0) return { ok: false, error: `${spec.label}: select at least one value.` };
      if (!f.values.every(inRange)) return { ok: false, error: `${spec.label}: values must be between ${spec.min} and ${max}.` };
      return { ok: true, value: [...new Set(f.values)].sort((a, b) => a - b).join(",") };
    }
    case "range":
      if (!inRange(f.from) || !inRange(f.to)) return { ok: false, error: `${spec.label}: range must be within ${spec.min}–${max}.` };
      if (f.from > f.to) return { ok: false, error: `${spec.label}: range start must not be after its end.` };
      return { ok: true, value: f.from === f.to ? String(f.from) : `${f.from}-${f.to}` };
  }
}

export function builderToCron(b: BuilderState): { ok: true; value: string } | { ok: false; errors: string[] } {
  const out: string[] = [];
  const errors: string[] = [];
  for (const spec of FIELDS) {
    const r = builderFieldToCron(b[spec.name], spec);
    if (r.ok) out.push(r.value);
    else errors.push(r.error);
  }
  return errors.length ? { ok: false, errors } : { ok: true, value: out.join(" ") };
}

export const CRON_EXAMPLES: { expression: string; label: string }[] = [
  { expression: "*/5 * * * *", label: "Every 5 minutes" },
  { expression: "0 * * * *", label: "Every hour, on the hour" },
  { expression: "0 9 * * 1-5", label: "09:00 on weekdays" },
  { expression: "30 2 * * 0", label: "02:30 every Sunday" },
  { expression: "0 0 1 * *", label: "Midnight on the 1st of every month" },
  { expression: "0 */6 * * *", label: "Every 6 hours" },
  { expression: "15 14 1,15 * *", label: "14:15 on the 1st and 15th" },
  { expression: "0 0 1 1 *", label: "Once a year, January 1st" },
];
