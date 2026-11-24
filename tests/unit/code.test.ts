import { runRegex, compileRegex, segmentText } from "@/features/code/regex";
import { minifyHtml, formatHtml } from "@/features/code/html";

describe("Regex tester", () => {
  it("finds all matches with g and only the first without", () => {
    const g = runRegex("\\d+", "g", "a1 b22 c333");
    expect(g.ok && g.matches.map((m) => m.text)).toEqual(["1", "22", "333"]);
    const one = runRegex("\\d+", "", "a1 b22");
    expect(one.ok && one.matches.map((m) => m.text)).toEqual(["1"]);
  });

  it("supports case-insensitive and named groups", () => {
    const r = runRegex("(?<w>HELLO)", "gi", "hello Hello");
    expect(r.ok && r.matches.length).toBe(2);
    expect(r.ok && r.matches[0].named).toEqual({ w: "hello" });
  });

  it("does not loop forever on empty matches", () => {
    const r = runRegex("x*", "g", "abc");
    expect(r.ok && r.matches.length).toBe(4);
    const u = runRegex("(?:)", "gu", "😀😀");
    expect(u.ok && u.matches.map((m) => m.index)).toEqual([0, 2, 4]);
  });

  it("reports invalid patterns and flags", () => {
    expect(compileRegex("(", "g")).toMatchObject({ ok: false });
    expect(runRegex("a", "q", "a")).toMatchObject({ ok: false, error: 'Unknown flag "q".' });
    expect(runRegex("a", "uv", "a")).toMatchObject({ ok: false });
  });

  it("caps match count", () => {
    const r = runRegex(".", "g", "x".repeat(100), 10);
    expect(r.ok && r.matches.length).toBe(10);
    expect(r.ok && r.truncated).toBe(true);
  });

  it("segments text accurately for highlighting", () => {
    const r = runRegex("b+", "g", "abbcb");
    expect(r.ok && segmentText("abbcb", r.matches)).toEqual([
      { text: "a" },
      { text: "bb", match: 0 },
      { text: "c" },
      { text: "b", match: 1 },
    ]);
  });
});

describe("HTML minifier", () => {
  it("removes comments and collapses whitespace around blocks", () => {
    const r = minifyHtml("<div>\n  <!-- note -->\n  <p>Hello   <b>big</b>   world</p>\n</div>\n");
    expect(r).toEqual({ ok: true, value: "<div><p>Hello <b>big</b> world</p></div>" });
  });

  it("preserves pre/textarea/script/style contents", () => {
    const src = "<pre>  a\n   b  </pre>\n<script>\n if (a  <  b) {}\n</script>\n<textarea>  x  </textarea>";
    const r = minifyHtml(src);
    expect(r.ok && r.value).toBe("<pre>  a\n   b  </pre><script>\n if (a  <  b) {}\n</script><textarea>  x  </textarea>");
  });

  it("keeps meaningful inline whitespace and attribute values", () => {
    const r = minifyHtml('<span>a</span> <span>b</span>\n<a   href="x"   title="two  spaces">l</a>');
    expect(r.ok && r.value).toBe('<span>a</span> <span>b</span> <a href="x" title="two  spaces">l</a>');
  });

  it("keeps conditional comments", () => {
    const r = minifyHtml("<!--[if IE]><p>IE</p><![endif]-->");
    expect(r.ok && r.value).toContain("[if IE]");
  });
});

describe("HTML formatter", () => {
  it("formats with configurable indentation", async () => {
    const two = await formatHtml("<div><ul><li>a</li><li>b</li></ul></div>", 2);
    expect(two.ok && two.value).toContain("\n  <ul>");
    const four = await formatHtml("<div><ul><li>a</li><li>b</li></ul></div>", 4);
    expect(four.ok && four.value).toContain("\n    <ul>");
  });

  it("handles malformed input gracefully", async () => {
    const r = await formatHtml("<div><span></div>");
    expect(typeof r.ok).toBe("boolean");
    if (!r.ok) expect(r.error.length).toBeGreaterThan(0);
  });
});
