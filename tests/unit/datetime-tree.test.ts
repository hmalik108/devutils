import { fromTimestamp, fromDateString, inferUnit } from "@/features/datetime/timestamp";
import { buildTree, detectSchema } from "@/features/json/tree";

describe("Unix timestamp converter", () => {
  it("distinguishes seconds and milliseconds", () => {
    expect(inferUnit(1700000000)).toBe("seconds");
    expect(inferUnit(1700000000000)).toBe("milliseconds");
    const s = fromTimestamp("1700000000");
    expect(s.ok && s.value.iso).toBe("2023-11-14T22:13:20.000Z");
    const ms = fromTimestamp("1700000000123");
    expect(ms.ok && ms.value.iso).toBe("2023-11-14T22:13:20.123Z");
    const forced = fromTimestamp("1700000000", "milliseconds");
    expect(forced.ok && forced.value.iso).toBe("1970-01-20T16:13:20.000Z");
  });

  it("formats UTC and a given time zone correctly", () => {
    const r = fromTimestamp("0", "seconds", "Asia/Kolkata");
    expect(r.ok && r.value.utc).toMatch(/Jan 01, 1970, 00:00:00 UTC/);
    expect(r.ok && r.value.local).toMatch(/05:30:00 GMT\+05:30/);
  });

  it("handles negative timestamps and errors", () => {
    const r = fromTimestamp("-86400");
    expect(r.ok && r.value.iso).toBe("1969-12-31T00:00:00.000Z");
    expect(fromTimestamp("abc")).toMatchObject({ ok: false });
    expect(fromTimestamp("")).toMatchObject({ ok: false });
    expect(fromTimestamp("99999999999999999999", "milliseconds")).toMatchObject({ ok: false, error: expect.stringMatching(/range/) });
  });

  it("converts dates to timestamps", () => {
    expect(fromDateString("2026-11-23T14:30:00Z")).toMatchObject({ ok: true, value: { seconds: 1795444200 } });
    expect(fromDateString("2026-11-23 14:30", "utc")).toMatchObject({ ok: true, value: { seconds: 1795444200 } });
    expect(fromDateString("2026-02-31", "utc")).toMatchObject({ ok: false });
    expect(fromDateString("not a date")).toMatchObject({ ok: false });
  });
});

describe("Tree visualizer", () => {
  it("renders JSON data as a unicode tree", () => {
    const r = buildTree('{"name":"Ada","tags":["a","b"],"meta":{"active":true}}');
    expect(r.ok && r.value.mode).toBe("data");
    expect(r.ok && r.value.tree).toBe(
      [
        "root {object · 3}",
        '├── name: "Ada" (string)',
        "├── tags [array · 2]",
        '│   ├── [0]: "a" (string)',
        '│   └── [1]: "b" (string)',
        "└── meta {object · 1}",
        "    └── active: true (boolean)",
      ].join("\n"),
    );
  });

  it("parses YAML and supports ASCII style", () => {
    const r = buildTree("a:\n  - 1\n", { style: "ascii" });
    expect(r.ok && r.value.format).toBe("yaml");
    expect(r.ok && r.value.tree).toBe("root {object · 1}\n`-- a [array · 1]\n    `-- [0]: 1 (number)");
  });

  it("detects JSON Schema and shows types, required and constraints", () => {
    const schema = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "integer", minimum: 1 },
        tags: { type: "array", items: { type: "string" }, minItems: 1 },
        status: { enum: ["active", "disabled"] },
      },
    };
    const r = buildTree(JSON.stringify(schema));
    expect(r.ok && r.value.mode).toBe("schema");
    const tree = r.ok ? r.value.tree : "";
    expect(tree).toContain("id: integer (required) [minimum: 1]");
    expect(tree).toContain("tags: array<string> [minItems: 1]");
    expect(tree).toContain('status: enum [enum: "active" | "disabled"]');
  });

  it("does not mistake data with a 'type' field for a schema", () => {
    expect(detectSchema({ type: "user", name: "x" }).isSchema).toBe(false);
    expect(detectSchema({ type: "object", properties: { a: 1 } }).isSchema).toBe(false);
    expect(detectSchema({ type: "object", properties: { a: { type: "string" } } }).isSchema).toBe(true);
    expect(detectSchema([1, 2]).isSchema).toBe(false);
  });

  it("reports parse errors", () => {
    expect(buildTree("{a: [")).toMatchObject({ ok: false });
    expect(buildTree("")).toMatchObject({ ok: false, message: "Input is empty." });
  });
});
