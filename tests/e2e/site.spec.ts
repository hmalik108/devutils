import { test, expect, type Page } from "@playwright/test";
import { liveTools, activeCategories } from "../../lib/tools-registry";

/** The interactive tool region (excludes Next's route announcer, which is also role=alert). */
const tool = (page: Page) => page.getByRole("region", { name: / tool$/ });

/** Navigate to a tool and wait until its interactive UI has hydrated. */
async function openTool(page: Page, slug: string) {
  await page.goto(`/${slug}`);
  await expect(tool(page)).toHaveAttribute("data-ready", "true");
}

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return errors;
}

test.describe("navigation", () => {
  test("homepage search navigates to a tool", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const search = page.getByRole("main").getByRole("combobox", { name: "Search tools" });
    await search.fill("epoch");
    await expect(page.getByRole("option", { name: /Unix Timestamp Converter/ })).toBeVisible();
    await search.press("Enter");
    await expect(page).toHaveURL(/\/unix-timestamp-converter$/);
  });

  test("tool directory filters by category and keyword", async ({ page }) => {
    await page.goto("/tools");
    await page.getByRole("button", { name: "Security Tools" }).click();
    await expect(page.getByRole("link", { name: /JWT Decoder/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Regex Tester/ })).toHaveCount(0);
    await page.getByRole("button", { name: "All" }).click();
    await page.getByRole("searchbox", { name: /Filter tools/ }).fill("yaml");
    await expect(page.getByRole("link", { name: /YAML Formatter/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /UUID Generator/ })).toHaveCount(0);
  });

  test("related tools link to other tools", async ({ page }) => {
    await page.goto("/json-formatter");
    const related = page.getByRole("region", { name: "Related tools" }).getByRole("link").first();
    const href = await related.getAttribute("href");
    await related.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
  });

  test("category pages work on direct access and refresh", async ({ page }) => {
    for (const c of activeCategories()) {
      const res = await page.goto(`/${c.slug}`);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(c.name);
    }
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("unknown routes return 404", async ({ page }) => {
    const res = await page.goto("/definitely-not-a-tool");
    expect(res?.status()).toBe(404);
  });
});

test.describe("every tool page", () => {
  for (const tool of liveTools()) {
    test(`${tool.slug} renders with SEO metadata and no console errors`, async ({ page }) => {
      const errors = collectErrors(page);
      const res = await page.goto(`/${tool.slug}`);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(tool.name);
      await expect(page).toHaveTitle(new RegExp(tool.seoTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/${tool.slug}$`));
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", tool.seoDescription);
      await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
      await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Privacy" })).toBeVisible();
      await expect(page.getByRole("region", { name: "Related tools" }).getByRole("link").first()).toBeVisible();
      // Long-form help lives on the guide page, not the tool page.
      await expect(page.getByRole("heading", { name: "Frequently asked questions" })).toHaveCount(0);
      await expect(page.getByRole("link", { name: /Guide, examples/ })).toHaveAttribute("href", `/guides/${tool.slug}`);
      await page.waitForLoadState("networkidle");
      expect(errors).toEqual([]);
    });
  }
});

test.describe("guides", () => {
  test("guide index links to every tool guide", async ({ page }) => {
    await page.goto("/guides");
    for (const t of liveTools()) await expect(page.getByRole("link", { name: `${t.name} guide` })).toHaveAttribute("href", `/guides/${t.slug}`);
  });

  for (const tool of liveTools()) {
    test(`guide for ${tool.slug} has instructions, examples and FAQ`, async ({ page }) => {
      const res = await page.goto(`/guides/${tool.slug}`);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(`${tool.name} guide`);
      for (const h of ["How to use", "Examples", "Frequently asked questions"]) await expect(page.getByRole("heading", { name: h, exact: true })).toBeVisible();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/guides/${tool.slug}$`));
      await page.getByRole("link", { name: `Open the ${tool.name}` }).click();
      await expect(page).toHaveURL(new RegExp(`/${tool.slug}$`));
    });
  }
});

test.describe("tools work", () => {
  test("JSON formatter formats, minifies and reports errors", async ({ page }) => {
    await openTool(page, "json-formatter");
    await page.getByRole("button", { name: "Sample" }).click();
    await page.getByRole("button", { name: "Format", exact: true }).click();
    await expect(page.locator('.cm-content[aria-label="Output JSON"]')).toContainText('"id": 1024');
    await page.getByRole("button", { name: "Flatten" }).click();
    await expect(page.locator('.cm-content[aria-label="Output JSON"]')).toContainText('"owner.name": "Ada"');
    await page.getByRole("button", { name: "Clear" }).click();
    await page.locator('.cm-content[aria-label="Input JSON"]').fill('{"a": 1,}');
    await page.getByRole("button", { name: "Format", exact: true }).click();
    await expect(tool(page).getByRole("alert")).toContainText("Trailing comma");
    await expect(tool(page).getByRole("alert")).toContainText("Line 1, column 9");
  });

  test("output panel expands to full screen and back", async ({ page }) => {
    await openTool(page, "json-formatter");
    await page.getByRole("button", { name: "Sample" }).click();
    await page.getByRole("button", { name: "Format", exact: true }).click();
    const output = page.locator('.cm-content[aria-label="Output JSON"]');
    await expect(output).toContainText('"id": 1024');
    const viewport = page.viewportSize()!;

    await page.getByRole("button", { name: "Full screen" }).click();
    const panel = page.locator("[data-fullscreen]");
    await expect(panel).toBeVisible();
    await expect(page.getByRole("button", { name: "Exit full screen" })).toBeVisible();
    await expect(output).toContainText('"id": 1024');
    const box = (await panel.locator(".cm-editor").boundingBox())!;
    expect(box.height).toBeGreaterThan(viewport.height * 0.6);
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("hidden");

    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Full screen" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");

    await page.getByRole("button", { name: "Full screen" }).click();
    await page.getByRole("button", { name: "Exit full screen" }).click();
    await expect(panel).toHaveCount(0);
  });

  test("Base64 encodes Unicode and reports invalid input", async ({ page }) => {
    await openTool(page, "base64-encoder-decoder");
    await page.getByLabel("Text to encode").fill("héllo 👋");
    await expect(page.getByLabel("Base64 output")).toHaveValue("aMOpbGxvIPCfkYs=");
    await page.getByRole("radio", { name: "Decode" }).click();
    await page.getByLabel("Base64 to decode").fill("abc$");
    await expect(tool(page).getByRole("alert")).toContainText("Invalid character");
  });

  test("UUID generator creates the requested quantity", async ({ page }) => {
    await openTool(page, "uuid-generator");
    await page.getByLabel("Quantity").fill("3");
    await page.getByRole("button", { name: "Generate" }).click();
    const items = page.getByTestId("uuid");
    await expect(items).toHaveCount(3);
    for (const t of await items.allTextContents()) expect(t).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download" }).click();
    expect((await download).suggestedFilename()).toBe("uuids.txt");
  });

  test("JWT decoder decodes and flags expiry without claiming verification", async ({ page }) => {
    await openTool(page, "jwt-decoder");
    await expect(page.getByText("Decoding does not verify the signature.")).toBeVisible();
    await page.getByRole("button", { name: "Sample" }).click();
    await expect(tool(page).getByText("Ada Lovelace")).toBeVisible();
    await expect(page.getByText("Token expired")).toBeVisible();
    await page.getByLabel("Encoded JWT").fill("not.a.jwt.at.all.x");
    await expect(tool(page).getByRole("alert")).toContainText("3 dot-separated segments");
  });

  test("URL encoder encodes components", async ({ page }) => {
    await openTool(page, "url-encoder-decoder");
    await page.getByLabel("Text to encode").fill("a b&c=é");
    await expect(page.getByLabel("Encoded output")).toHaveValue("a%20b%26c%3D%C3%A9");
  });

  test("Regex tester highlights matches and stops runaway patterns", async ({ page, browserName }) => {
    await openTool(page, "regex-tester");
    await expect(page.getByRole("status").filter({ hasText: "matches" })).toContainText("2 matches");
    await expect(page.locator("mark")).toHaveCount(2);
    await page.getByLabel("Regular expression").fill("(a+)+$");
    await page.getByLabel("Test text", { exact: true }).fill("a".repeat(40) + "!");
    // V8 and SpiderMonkey backtrack exponentially here, so the worker timeout fires.
    // JavaScriptCore caps backtracking itself and returns quickly. Either way the UI must not freeze.
    if (browserName === "webkit") await expect(page.getByRole("status").filter({ hasText: "matches" })).toContainText("0 matches");
    else await expect(page.getByText("Pattern took too long")).toBeVisible({ timeout: 10_000 });
    // The page is still responsive afterwards.
    await page.getByLabel("Regular expression").fill("a+");
    await expect(page.getByRole("status").filter({ hasText: "match" })).toContainText("1 match");
  });

  test("Timestamp converter handles seconds", async ({ page }) => {
    await openTool(page, "unix-timestamp-converter");
    await page.getByPlaceholder("e.g. 1700000000 or 1700000000000").fill("1700000000");
    await expect(page.getByText("2023-11-14T22:13:20.000Z").first()).toBeVisible();
    await expect(page.getByText("Interpreted as")).toContainText("seconds");
  });

  test("JSON diff finds differences", async ({ page }) => {
    await openTool(page, "json-diff");
    await page.getByRole("button", { name: "Sample" }).click();
    await page.getByRole("button", { name: "Compare" }).click();
    await expect(page.getByText("1 added · 1 removed · 2 changed")).toBeVisible();
  });

  test("Cron generator explains expressions and rejects invalid ones", async ({ page }) => {
    await openTool(page, "cron-generator");
    const expr = page.getByRole("textbox", { name: "Cron expression" });
    await expr.fill("0 9 * * 1-5");
    await expect(tool(page).getByText("At 09:00 on Monday through Friday.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Next 5 runs" })).toBeVisible();
    await expr.fill("0 0 L * *");
    await expect(tool(page).getByRole("alert")).toContainText("Quartz");
  });

  test("HTML formatter formats and minifies", async ({ page }) => {
    await openTool(page, "html-formatter");
    await page.getByRole("button", { name: "Sample" }).click();
    await page.getByRole("button", { name: "Minify" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Minified" })).toBeVisible();
    await page.getByRole("button", { name: "Format" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Formatted." })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.cm-content[aria-label="Output HTML"]')).toContainText("<!doctype html>");
  });

  test("YAML formatter validates and formats", async ({ page }) => {
    await openTool(page, "yaml-formatter");
    await page.getByRole("button", { name: "Sample" }).click();
    await page.getByRole("button", { name: "Format" }).click();
    await expect(page.getByText(/Valid YAML/)).toBeVisible();
    await page.getByRole("button", { name: "Clear" }).click();
    await page.locator('.cm-content[aria-label="Input YAML"]').fill("a: [1, 2");
    await page.getByRole("button", { name: "Validate" }).click();
    await expect(tool(page).getByRole("alert")).toContainText("Invalid YAML");
  });

  test("Tree visualizer detects schemas", async ({ page }) => {
    await openTool(page, "json-yaml-tree");
    await page.getByRole("button", { name: "Schema sample" }).click();
    await expect(tool(page).getByText("JSON Schema", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Tree output")).toContainText("email: string (required)");
    await page.getByRole("button", { name: "Data sample" }).click();
    await expect(page.getByLabel("Tree output")).toContainText("replicas: 3 (number)");
  });

  test("Hash generator computes SHA-256", async ({ page }) => {
    await openTool(page, "hash-generator");
    await expect(page.getByText("Not for password storage.")).toBeVisible();
    await page.getByLabel("Text to hash (UTF-8)").fill("abc");
    await expect(page.getByText("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")).toBeVisible();
  });
});

test.describe("copy", () => {
  test("copy output writes to the clipboard", async ({ page, context, browserName }) => {
    test.skip(browserName !== "chromium", "Clipboard permissions are Chromium-only in Playwright");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await openTool(page, "url-encoder-decoder");
    await page.getByLabel("Text to encode").fill("a b");
    await page.getByRole("button", { name: "Copy" }).click();
    await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("a%20b");
  });
});

test.describe("theme", () => {
  test("theme choice persists across reloads", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByTestId("theme-toggle");
    await expect(toggle).toHaveAttribute("aria-label", /Theme: System/);
    await toggle.click(); // → light
    await toggle.click(); // → dark
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.goto("/json-formatter");
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 375, height: 740 } });
  test("menu opens and tools are usable without horizontal scroll", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Tools" }).click();
    await expect(page).toHaveURL(/\/tools$/);
    for (const slug of ["json-formatter", "cron-generator", "regex-tester"]) {
      await page.goto(`/${slug}`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${slug} horizontal overflow`).toBeLessThanOrEqual(1);
    }
  });
});

test("sitemap and robots are available", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  const xml = await sitemap.text();
  for (const t of liveTools()) {
    expect(xml).toContain(`/${t.slug}</loc>`);
    expect(xml).toContain(`/guides/${t.slug}</loc>`);
  }
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Sitemap:");
});
