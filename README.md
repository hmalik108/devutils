# devutils.info

Free, fast, privacy-first developer utilities that run entirely in the browser.
Built from the PRD in [`devutilsinfo.md`](./devutilsinfo.md). The step-by-step build plan and status are in [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md).

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui conventions · Lucide · CodeMirror 6 · Prettier (standalone) · `yaml` · Vitest + React Testing Library · Playwright.

## Quick start

```bash
npm install
npm run dev            # http://localhost:3000
npm run build && npm start
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build (all pages are statically generated) |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc --noEmit` |
| `npm test` | Unit + integration tests (Vitest, jsdom) |
| `npm run test:e2e` | Playwright on Chromium, Firefox, WebKit and a mobile viewport. Builds and starts the app on port 3100. First run: `npx playwright install` |

Copy `.env.example` to `.env.local` to set the site URL or turn on analytics.

## Tools (13 live)

| Category | Tool | URL |
| --- | --- | --- |
| JSON Tools `/json-tools` | JSON Formatter & Validator (format, minify, validate, flatten) | `/json-formatter` |
| | JSON Diff Checker | `/json-diff` |
| | JSON/YAML Tree Visualizer (detects JSON Schema) | `/json-yaml-tree` |
| Encoding `/encoding` | Base64 Encoder / Decoder | `/base64-encoder-decoder` |
| | URL Encoder / Decoder | `/url-encoder-decoder` |
| Code Tools `/code-tools` | Regex Tester | `/regex-tester` |
| | HTML Formatter / Minifier | `/html-formatter` |
| | UUID Generator | `/uuid-generator` |
| Security `/security` | JWT Decoder | `/jwt-decoder` |
| | Hash Generator (SHA-1/256/384/512) | `/hash-generator` |
| Date & Time `/date-time` | Unix Timestamp Converter | `/unix-timestamp-converter` |
| DevOps `/devops` | Cron Expression Generator | `/cron-generator` |
| | YAML Formatter / Validator | `/yaml-formatter` |

Other routes: `/`, `/tools` (searchable directory, `?q=` and `?category=`), `/categories`, `/guides` and `/guides/<tool-slug>` (how-to, examples and FAQ for each tool), `/about`, `/contact`, `/privacy-policy`, `/terms`, `/sitemap.xml`, `/robots.txt`. `/json-validator` redirects (308) to `/json-formatter`.

## Project structure

```
app/
  layout.tsx              Root layout: fonts, theme provider, header/footer, optional analytics script
  page.tsx                Homepage (search, featured, categories, recently added, privacy note)
  [slug]/page.tsx         Tool pages AND category pages, statically generated from the registry
  guides/                 Guide index + one guide page per tool (long-form content)
  tools/ categories/      Directory + category index
  about/ contact/ privacy-policy/ terms/
  sitemap.ts robots.ts    Generated from the registry
  not-found.tsx error.tsx
components/
  ui/                     shadcn-style primitives (button, input, select, segmented, badge…)
  layout/                 Header, footer, theme toggle, mobile nav
  navigation/             Breadcrumbs (+ BreadcrumbList JSON-LD), ⌘K search dialog
  tools/                  Shared tool page layout, tool cards, search, directory, copy/download, status messages
  tool-ui/                One client component per tool (the interactive part only)
  editors/                CodeMirror 6 wrapper, lazily loaded, client-only
  seo/                    JSON-LD renderer
features/                 Pure processing logic, no React. Unit tested.
  json/ encoding/ security/ code/ datetime/ devops/
  *.worker.ts             Web Workers (JSON on large input, regex always)
content/tools/            Per-tool guide content (intro, how-to, examples, FAQ), shown on /guides/<slug>; the tool page shows only its privacy note
lib/
  tools-registry.ts       ★ Single source of truth for tool metadata
  seo.ts                  Metadata + structured-data builders
  analytics.ts            Privacy-safe event tracking (no inputs, ever)
  worker-client.ts        Run work in a worker, with timeout and terminate
  limits.ts site.ts download.ts utils.ts
tests/
  unit/                   Logic tests (Vitest)
  integration/            Component tests (React Testing Library)
  e2e/                    Playwright
```

## The tool registry

`lib/tools-registry.ts` holds every tool's slug, name, category, descriptions, SEO title and meta description, keywords, icon, status, `featured`, `addedAt` and related tools. Everything below reads from it, so no tool metadata is repeated anywhere else:

- homepage sections, `/tools`, `/categories`, category pages and `/guides`
- search (`searchTools`, ranked by name, then keyword, then description) and related tools (`relatedTools`)
- `generateStaticParams`, `generateMetadata`, canonical URLs, Open Graph and JSON-LD
- `sitemap.xml`

Only tools with `status: "live"` are routed, listed, searched or put in the sitemap. A `"planned"` tool cannot be indexed by accident, because its URL returns 404.

### Adding a tool

1. Add the registry entry with `status: "planned"`.
2. Write the logic in `features/<area>/` and its tests in `tests/unit/`.
3. Build the UI in `components/tool-ui/<name>.tsx` and map it in `components/tools/tool-interface.tsx`.
4. Write the content in `content/tools/<slug>.ts` and register it in `content/tools/index.ts`.
5. Set `status: "live"`. The registry test checks that slugs, titles and descriptions are unique.

## Privacy and security

- **No backend.** The project has no API routes and no server actions. All processing runs in the browser, using Web Crypto, `TextEncoder`/`atob` and Web Workers.
- **Inputs are never persisted or sent.** Only the theme preference goes to `localStorage`. The `track()` API accepts a tool slug and a coarse action label, nothing else.
- **Security headers** are set in `next.config.ts`: CSP (`connect-src 'self'`), `frame-ancestors 'none'`, nosniff, HSTS, Referrer-Policy, Permissions-Policy and COOP.
- **Tool-specific safeguards:**
  - The JWT decoder shows a permanent "signature not verified" warning.
  - The hash tool warns against using it for passwords and labels SHA-1 as legacy.
  - UUIDs come only from `crypto.randomUUID` or `getRandomValues`; a test asserts `Math.random` is never called.
  - Regex matching runs in a worker that is terminated after 1.5 s.
  - HTML is handled only as text and never inserted into the DOM.
  - YAML parsing uses the 1.2 core schema, builds no custom tags, caps aliases and rejects duplicate keys.
- **Input size limits:** 5 MB of text per tool, 1 MB for regex test text, 200 MB per file for hashing.

## Deploying

Deploy to Vercel as-is. Set `NEXT_PUBLIC_SITE_URL`. On preview deployments `robots.txt` disallows all crawling, so only production is indexed. After the first production deploy, verify the domain in Google Search Console and submit `/sitemap.xml`.
