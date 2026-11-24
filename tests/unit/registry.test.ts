import { tools, categories, liveTools, searchTools, relatedTools, getTool, toolsInCategory } from "@/lib/tools-registry";

describe("tool registry", () => {
  it("has unique slugs, titles and descriptions", () => {
    const uniq = (xs: string[]) => new Set(xs).size === xs.length;
    expect(uniq(tools.map((t) => t.slug))).toBe(true);
    expect(uniq(tools.map((t) => t.seoTitle))).toBe(true);
    expect(uniq(tools.map((t) => t.seoDescription))).toBe(true);
    expect(uniq([...tools.map((t) => t.slug), ...categories.map((c) => c.slug)])).toBe(true);
  });

  it("uses lowercase hyphenated slugs and valid categories / related links", () => {
    for (const t of tools) {
      expect(t.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(categories.some((c) => c.slug === t.category)).toBe(true);
      for (const r of t.related) expect(tools.some((x) => x.slug === r)).toBe(true);
      expect(t.seoDescription.length).toBeLessThanOrEqual(170);
    }
  });

  it("contains the MVP tools", () => {
    expect(liveTools().length).toBeGreaterThanOrEqual(12);
    for (const c of categories) expect(toolsInCategory(c.slug).length).toBeGreaterThan(0);
  });

  it("searches by name, keyword and description", () => {
    expect(searchTools("jwt")[0].slug).toBe("jwt-decoder");
    expect(searchTools("epoch")[0].slug).toBe("unix-timestamp-converter");
    expect(searchTools("sha256")[0].slug).toBe("hash-generator");
    expect(searchTools("json yaml tree")[0].slug).toBe("json-yaml-tree");
    expect(searchTools("guid").map((t) => t.slug)).toContain("uuid-generator");
    expect(searchTools("zzzz")).toEqual([]);
  });

  it("returns related tools excluding itself", () => {
    const rel = relatedTools("json-formatter");
    expect(rel.length).toBeGreaterThan(0);
    expect(rel.some((t) => t.slug === "json-formatter")).toBe(false);
    expect(getTool("does-not-exist")).toBeUndefined();
  });
});
