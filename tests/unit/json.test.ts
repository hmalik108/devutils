import { formatJson, minifyJson, flattenValue, parseJson, offsetToLineCol } from "@/features/json/format";
import { diffJson, summarize, diffToText } from "@/features/json/diff";

describe("JSON formatter", () => {
  it("formats valid JSON with 2/4/tab indentation", () => {
    expect(formatJson('{"a":1,"b":[1,2]}')).toEqual({ ok: true, value: '{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}' });
    const four = formatJson('{"a":1}', 4);
    expect(four.ok && four.value).toBe('{\n    "a": 1\n}');
    const tab = formatJson('{"a":1}', "tab");
    expect(tab.ok && tab.value).toBe('{\n\t"a": 1\n}');
  });

  it("sorts keys deeply when asked", () => {
    const r = formatJson('{"b":1,"a":{"d":1,"c":2}}', 2, true);
    expect(r.ok && r.value.replace(/\s/g, "")).toBe('{"a":{"c":2,"d":1},"b":1}');
  });

  it("minifies to valid compact JSON", () => {
    const r = minifyJson('{\n  "a": [1, 2, { "b": null }]\n}');
    expect(r).toEqual({ ok: true, value: '{"a":[1,2,{"b":null}]}' });
    expect(JSON.parse((r as { value: string }).value)).toEqual({ a: [1, 2, { b: null }] });
  });

  it("reports invalid JSON with a line and column", () => {
    const r = parseJson('{\n  "a": 1,\n  "b": }');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.message.length).toBeGreaterThan(0);
      expect(r.error.line).toBe(3);
      expect(r.error.column).toBeGreaterThan(0);
    }
  });

  it("gives consistent, located messages for common mistakes", () => {
    const err = (t: string) => {
      const r = parseJson(t);
      if (r.ok) throw new Error("expected failure");
      return r.error;
    };
    expect(err('{"a":1,}')).toMatchObject({ message: "Trailing comma before }", line: 1, column: 8 });
    expect(err("{'a':1}")).toMatchObject({ line: 1, column: 2 });
    expect(err('[1,2')).toMatchObject({ message: expect.stringMatching(/end of input/) });
    expect(err('{"a":tru}')).toMatchObject({ line: 1, column: 6 });
    expect(err('{"a":1} x')).toMatchObject({ message: expect.stringMatching(/after the end/) });
    expect(err('"bad \\q"')).toMatchObject({ message: expect.stringMatching(/escape/) });
    expect(err("")).toEqual({ message: "Input is empty." });
    expect(err("01")).toMatchObject({ column: 2 });
  });

  it("converts offsets to line/column", () => {
    expect(offsetToLineCol("ab\ncd", 4)).toEqual({ line: 2, column: 2 });
  });

  it("flattens nested structures into single-level paths", () => {
    expect(flattenValue({ a: { b: 1, c: [true, { d: "x" }] }, "odd key": null, e: {}, f: [] })).toEqual({
      "a.b": 1,
      "a.c[0]": true,
      "a.c[1].d": "x",
      '["odd key"]': null,
      e: {},
      f: [],
    });
    expect(flattenValue([1, [2]])).toEqual({ "[0]": 1, "[1][0]": 2 });
    expect(flattenValue(5)).toEqual({ $: 5 });
  });
});

describe("JSON diff", () => {
  it("treats differently formatted / ordered JSON as equivalent", () => {
    const a = JSON.parse('{"a":1,"b":[1,2],"c":{"d":null}}');
    const b = JSON.parse('{\n "c": {"d": null},\n "b": [1, 2],\n "a": 1\n}');
    expect(diffJson(a, b).entries).toEqual([]);
    expect(diffToText([])).toMatch(/No differences/);
  });

  it("finds added, removed and changed values by path", () => {
    const { entries } = diffJson({ a: 1, b: { c: 2 }, arr: [1, 2, 3], t: "x" }, { a: 2, b: {}, arr: [1, 2], t: 1, n: true });
    expect(entries).toEqual(
      expect.arrayContaining([
        { kind: "changed", path: "a", left: 1, right: 2 },
        { kind: "removed", path: "b.c", left: 2 },
        { kind: "removed", path: "arr[2]", left: 3 },
        { kind: "changed", path: "t", left: "x", right: 1 },
        { kind: "added", path: "n", right: true },
      ]),
    );
    expect(summarize(entries)).toEqual({ added: 1, removed: 2, changed: 2 });
  });

  it("caps the number of differences", () => {
    const left = Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`k${i}`, i]));
    const r = diffJson(left, {}, { limit: 10 });
    expect(r.entries).toHaveLength(10);
    expect(r.truncated).toBe(true);
  });
});
