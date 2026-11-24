# Implementation plan — devutils.info MVP

The build follows PRD §16: work in small steps, building and verifying one piece at a time. ✅ means done and verified by automated tests.

## Phase 0 — Foundation ✅

1. ✅ Scaffold Next.js 16 (App Router), TypeScript in strict mode, Tailwind v4, ESLint, Vitest and Playwright.
2. ✅ Add design tokens (neutral light and dark palettes, plus colours for success, warning, destructive and diff states) in `app/globals.css`.
3. ✅ Add shadcn-style UI primitives, the theme provider (light, dark or system; only the theme is stored), header, mobile nav, footer and skip link.
4. ✅ Create the **central tool registry** (`lib/tools-registry.ts`) with categories, search, related tools and live/planned status.
5. ✅ Add SEO utilities (`lib/seo.ts`): per-page metadata, canonical URLs, Open Graph, and WebSite, SoftwareApplication and BreadcrumbList JSON-LD.
6. ✅ Add security headers and CSP (`next.config.ts`).
7. ✅ Add the worker runner with timeout and terminate (`lib/worker-client.ts`), input size limits, and analytics that never receives inputs.

## Phase 1 — Shared tool infrastructure ✅

1. ✅ One route, `app/[slug]`, statically generates every tool page and category page from the registry. Unknown slugs return 404.
2. ✅ Shared `ToolPageLayout` contains, in order: breadcrumb, H1, description, the tool itself (near the top), about, how-to, examples, extra sections, FAQ, privacy, and related tools.
3. ✅ The tool interface map lazy-loads each tool's UI as its own chunk, still server-rendered, and sets a `data-ready` hydration marker.
4. ✅ Lazy CodeMirror 6 wrapper: client-only, keeps its space reserved to avoid layout shift, loads language support on demand, and switches between light and dark themes.
5. ✅ Shared copy and download buttons, an accessible `StatusMessage` (icon plus text, `role="alert"`), and a segmented radio group.

## Phase 2 — Tools, one at a time ✅

For each tool: write the logic in `features/`, then unit tests, then the UI, then the content, then the e2e test, and finally set it to live.

| # | Tool | Key decisions |
| --- | --- | --- |
| 1 | JSON Formatter & Validator | Own RFC 8259 error locator, so line and column are the same in every browser (recent V8 no longer reports a position). Inputs over 100 KB go to a worker. Flattening uses `a.b[0]` paths and keeps empty containers. |
| 2 | Base64 | UTF-8 via `TextEncoder`. Accepts standard and URL-safe input, with padding optional. Decoding is strict UTF-8 with a clear error for binary data. |
| 3 | UUID | `crypto.randomUUID`, with a `getRandomValues` fallback that sets the version and variant bits. 1–1,000 per batch. |
| 4 | JWT Decoder | Decodes only, behind a permanent warning. Recognises JWE. Shows `exp`, `iat` and `nbf` as UTC and local time, plus status. Warns on `alg: none`. |
| 5 | URL Encoder | Component and full-URL modes. `+` as space is optional. Reports the exact position of a malformed escape. |
| 6 | Regex Tester | Always runs in a worker with a 1.5 s timeout. Highlights matches safely without HTML. Shows groups and named groups. Caps at 10k matches. |
| 7 | Unix Timestamp | Auto-detects seconds or ms (≥1e11 means ms) with an override. Shows UTC, local and ISO. Converts dates back to timestamps, rejecting dates like 2026-02-31. |
| 8 | JSON Diff | Structural comparison by path that ignores key order and whitespace. Each side is validated separately. Uses a worker when large. Reports can be copied or downloaded. |
| 9 | Cron Generator | Strict 5-field Vixie/POSIX dialect, documented on the page. The builder refuses invalid settings. Plain-English explanation. Previews next runs (local or UTC, with a DST note). Warns when a schedule can never run. |
| 10 | HTML Formatter | Prettier standalone, loaded on click. Minifier is conservative and keeps `pre`, `textarea`, `script` and `style` exactly. HTML is never rendered. |
| 11 | YAML Formatter | `yaml` package with the 1.2 core schema. Round-trips the document tree, keeping comments and types. Caps aliases and rejects duplicate keys. |
| 12 | JSON/YAML Tree | Parses JSON, falling back to YAML. Detects JSON Schema and explains why, with a manual override. Shows types, required fields and constraints. Unicode or ASCII output. |
| 13 | Hash Generator | Web Crypto SHA-1/256/384/512 for text or files. Hex or Base64 output. Compare against a known checksum. Warns that it's not for passwords. |

## Phase 3 — Site pages and SEO ✅

1. ✅ Homepage: search, featured tools, categories, recently added (from real `addedAt` data), privacy statement.
2. ✅ `/tools` directory: filters by category and keyword, kept in the URL, with a crawlable static fallback. `/categories`.
3. ✅ About, Contact, Privacy Policy and Terms pages.
4. ✅ `sitemap.xml` and `robots.txt` built from the registry. `robots.txt` disallows crawling on preview deployments.
5. ✅ Every tool has a unique title, meta description, canonical URL, H1, FAQ and internal links. The registry test enforces uniqueness.

## Phase 4 — Verification ✅

- ✅ 75 Vitest unit and integration tests: all tool logic, the registry, search, copy, download, error a11y, and tool UIs.
- ✅ 138 Playwright tests on Chromium, Firefox, WebKit and a mobile viewport. They cover every tool page (metadata, no console errors), running each tool, search, category filters, related links, theme persistence, clipboard, downloads, mobile overflow, 404s, and sitemap/robots. All pass, including on a repeated run.
- ✅ Local measurements: CLS ≈ 0. CodeMirror loads only on editor-based tools. Prettier loads only when you click Format.

## Phase 5 — Launch (manual / remaining)

- [ ] Replace the placeholder contact address (`lib/site.ts → contactEmail`) with a monitored inbox.
- [ ] Deploy to Vercel and set `NEXT_PUBLIC_SITE_URL`. HTTPS is automatic.
- [ ] Verify Google Search Console and submit the sitemap.
- [ ] Optional: set `NEXT_PUBLIC_ANALYTICS_DOMAIN` for Plausible-compatible, cookie-less analytics, then add its host to the CSP (this happens automatically from the env var).
- [ ] Error monitoring: the route error boundary already sends a `tool_error` event without any content. If a dedicated service such as Sentry is added, configure it to strip request bodies and breadcrumbs.
- [x] Open Graph images: a site default (`app/opengraph-image.tsx`) plus one per tool and category (`app/[slug]/opengraph-image.tsx`), generated at build time; guides reuse their tool's image.
- [ ] Measure field Core Web Vitals after launch (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at p75).
- [ ] Write guides for `content/guides/` (PRD §10.4). Shorter versions of these topics are already on each tool page.

## Phase 6 — Post-launch layout changes ✅

- ✅ Tool pages focus on the tool: wider layout (`max-w-7xl`) and larger input/output areas, then a privacy note and related tools as a horizontal row of cards.
- ✅ Long-form help (about, how-to, examples, FAQ) moved to `/guides/<slug>` and is linked from each tool page. `/guides` lists every guide, and all guides are in the sitemap.
- ✅ Removed the homepage's "Recently added" section.
- ✅ Output panels can expand to full screen (`ToolPanel expandable`): JSON/HTML/YAML output, tree, JSON diff, Base64/URL output, regex matches and details, UUID list, JWT header and payload. Esc or the button exits; page scroll is locked while expanded.

## Deviations from the PRD

| PRD | Decision | Why |
| --- | --- | --- |
| §7 lists 12 tools; §5.3, §9.6, §12 and §15 also list a **Hash Generator** | Built 13 tools, including Hash Generator | The hash tool appears in the URL map, test plan, safeguards and content strategy. Without it, the Security category would have only one tool. |
| §5.3 shows `/json-validator` | 308 redirect to `/json-formatter` | §7 Tool 1 combines formatting and validation in one tool. |
| §5.3 draws tools nested under categories | Tools use flat URLs such as `/json-formatter`; categories are at `/json-tools` and so on | §7 gives every tool a flat URL, and §9.6 matches. |
| §5.3 doesn't place UUID or the Tree Visualizer | UUID goes under Code Tools; Tree under JSON Tools | Closest fit (the PRD gives "generate test identifiers" as a QA task). |
| §9.2 lists "advertising components" | Not created | Excluded by the out-of-scope and no-monetization instruction. The architecture leaves room to add them later. |
| §6.3 and §10.1 put instructions, examples and FAQ on each tool page | They're on a linked `/guides/<slug>` page; the tool page keeps the tool, privacy note and related tools | Owner's decision after launch: the tools should explain themselves through their design. |
| CSP | `script-src 'unsafe-inline'` | Statically generated pages can't use per-request nonces. Everything else is locked to `'self'`. |
