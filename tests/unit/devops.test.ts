import { parseCron, explainCron, nextRuns, builderToCron, defaultBuilder } from "@/features/devops/cron";
import { parseYamlSafe, formatYaml } from "@/features/devops/yaml";

describe("Cron parser", () => {
  it("parses standard expressions", () => {
    const r = parseCron("*/15 9-17 * * MON-FRI");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.fields[0].values).toEqual([0, 15, 30, 45]);
      expect(r.value.fields[1].values).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17]);
      expect(r.value.fields[4].values).toEqual([1, 2, 3, 4, 5]);
    }
  });

  it("maps day-of-week 7 to Sunday and expands macros", () => {
    const r = parseCron("0 0 * * 7");
    expect(r.ok && r.value.fields[4].values).toEqual([0]);
    const m = parseCron("@daily");
    expect(m.ok && m.value.expression).toBe("0 0 * * *");
  });

  it("rejects invalid or non-standard syntax clearly", () => {
    expect(parseCron("60 * * * *")).toMatchObject({ ok: false, error: expect.stringMatching(/out of range/) });
    expect(parseCron("* * * *")).toMatchObject({ ok: false, error: expect.stringMatching(/5 fields/) });
    expect(parseCron("0 * * * * *")).toMatchObject({ ok: false, error: expect.stringMatching(/seconds/) });
    expect(parseCron("0 0 L * *")).toMatchObject({ ok: false, error: expect.stringMatching(/Quartz/) });
    expect(parseCron("0 0 ? * MON")).toMatchObject({ ok: false });
    expect(parseCron("5/10 * * * *")).toMatchObject({ ok: false, error: expect.stringMatching(/non-standard/) });
    expect(parseCron("0 17-9 * * *")).toMatchObject({ ok: false, error: expect.stringMatching(/backwards/) });
    expect(parseCron("*/0 * * * *")).toMatchObject({ ok: false });
    expect(parseCron("@reboot")).toMatchObject({ ok: false });
  });

  it("explains expressions in English", () => {
    const e = (s: string) => {
      const r = parseCron(s);
      if (!r.ok) throw new Error(r.error);
      return explainCron(r.value);
    };
    expect(e("0 9 * * 1-5")).toBe("At 09:00 on Monday through Friday.");
    expect(e("*/5 * * * *")).toBe("Every 5 minutes.");
    expect(e("* * * * *")).toBe("Every minute.");
    expect(e("0 0 1 1 *")).toBe("At 00:00 on day-of-month 1 in January.");
    expect(e("0 0 1 * 1")).toMatch(/day-of-month 1 or on Monday/);
  });

  it("computes next runs in UTC", () => {
    const r = parseCron("30 2 * * 0");
    if (!r.ok) throw new Error();
    const runs = nextRuns(r.value, 3, new Date("2026-11-23T00:00:00Z"), "utc"); // a Monday
    expect(runs.map((d) => d.toISOString())).toEqual([
      "2026-11-29T02:30:00.000Z",
      "2026-12-06T02:30:00.000Z",
      "2026-12-13T02:30:00.000Z",
    ]);
  });

  it("applies the Vixie day-of-month OR day-of-week rule", () => {
    const r = parseCron("0 0 1 * 1");
    if (!r.ok) throw new Error();
    const runs = nextRuns(r.value, 3, new Date("2026-11-23T12:00:00Z"), "utc");
    expect(runs.map((d) => d.toISOString().slice(0, 10))).toEqual(["2026-11-30", "2026-12-01", "2026-12-07"]);
  });

  it("finds sparse schedules (Feb 29) and returns nothing for impossible ones", () => {
    const leap = parseCron("0 0 29 2 *");
    if (!leap.ok) throw new Error();
    expect(nextRuns(leap.value, 1, new Date("2026-11-23T00:00:00Z"), "utc")[0].toISOString()).toBe("2028-02-29T00:00:00.000Z");
    const never = parseCron("0 0 30 2 *");
    if (!never.ok) throw new Error();
    expect(nextRuns(never.value, 1, new Date(), "utc")).toEqual([]);
  });

  it("builder generates valid expressions and blocks invalid configs", () => {
    const b = defaultBuilder();
    expect(builderToCron(b)).toEqual({ ok: true, value: "0 * * * *" });
    b.hour = { ...b.hour, mode: "range", from: 9, to: 17 };
    b.dayOfWeek = { ...b.dayOfWeek, mode: "specific", values: [5, 1] };
    expect(builderToCron(b)).toEqual({ ok: true, value: "0 9-17 * * 1,5" });
    b.minute = { ...b.minute, values: [] };
    expect(builderToCron(b)).toMatchObject({ ok: false, errors: [expect.stringMatching(/at least one/)] });
    const c = defaultBuilder();
    c.hour = { ...c.hour, mode: "range", from: 18, to: 9 };
    expect(builderToCron(c).ok).toBe(false);
  });
});

describe("YAML", () => {
  it("parses valid YAML preserving types", () => {
    const r = parseYamlSafe("a: 1\nb: true\nc: null\nd: '1'\ne: [1.5, x]\n");
    expect(r).toMatchObject({ ok: true, value: { a: 1, b: true, c: null, d: "1", e: [1.5, "x"] } });
  });

  it("reports errors with line numbers", () => {
    const r = parseYamlSafe("a: 1\nb: [1, 2\nc: 3\n");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors[0].message.length).toBeGreaterThan(0);
      expect(r.errors[0].line).toBeGreaterThanOrEqual(2);
    }
    expect(parseYamlSafe("a: 1\na: 2\n").ok).toBe(false); // duplicate keys
  });

  it("does not construct custom types", () => {
    // Unknown tags are reported as warnings and the node stays plain data — nothing is executed.
    const r = parseYamlSafe("x: !!python/object/apply:os.system ['ls']\n");
    expect(r).toMatchObject({ ok: true, value: { x: ["ls"] } });
    expect(r.ok && r.warnings[0].message).toMatch(/Unresolved tag/);
  });

  it("guards against alias bombs", () => {
    const bomb = ["a: &a [x,x,x,x,x,x,x,x,x,x]", "b: &b [*a,*a,*a,*a,*a,*a,*a,*a,*a,*a]", "c: &c [*b,*b,*b,*b,*b,*b,*b,*b,*b,*b]", "d: &d [*c,*c,*c,*c,*c,*c,*c,*c,*c,*c]", "e: [*d,*d,*d,*d,*d,*d,*d,*d,*d,*d]"].join("\n");
    expect(parseYamlSafe(bomb).ok).toBe(false);
  });

  it("formats with consistent indentation and keeps comments", () => {
    const r = formatYaml("# config\nserver:\n      port: 8080   # http\n      hosts:\n      - a\n      - b\n");
    expect(r.ok && r.value).toBe("# config\nserver:\n  port: 8080 # http\n  hosts:\n    - a\n    - b\n");
    const multi = formatYaml("a: 1\n---\nb: 2\n");
    expect(multi.ok && multi.value).toBe("a: 1\n---\nb: 2\n");
  });
});
