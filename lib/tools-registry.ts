/**
 * Central tool registry — the single source of truth for tool metadata.
 *
 * Drives: homepage, /tools directory, category pages, search, related tools,
 * page metadata/structured data, the sitemap and static route generation.
 *
 * Adding a tool:
 *   1. Add an entry to `tools` below (status "planned" until it is finished).
 *   2. Add processing logic in features/<area>/ and unit tests in tests/unit/.
 *   3. Add the UI in components/tool-ui/ and map it in components/tools/tool-interface.tsx.
 *   4. Add supporting content in content/tools/<slug>.ts and register it in content/tools/index.ts.
 *   5. Flip status to "live". Only live tools are routed, listed, searched and put in the sitemap.
 */
import type { LucideIcon } from "lucide-react";
import {
  Braces,
  Binary,
  Code2,
  ShieldCheck,
  Clock,
  Server,
  FileJson,
  GitCompare,
  ListTree,
  Link2,
  Fingerprint,
  KeyRound,
  Hash,
  Regex,
  FileCode,
  CalendarClock,
  FileText,
} from "lucide-react";

export type CategorySlug = "json-tools" | "encoding" | "code-tools" | "security" | "date-time" | "devops";

export type ToolStatus = "live" | "planned";

export interface Category {
  slug: CategorySlug;
  name: string;
  description: string;
  icon: LucideIcon;
}

export interface Tool {
  slug: string;
  name: string;
  category: CategorySlug;
  /** One-line description shown on cards and under the H1. */
  description: string;
  /** <title> — must be unique across the site. */
  seoTitle: string;
  /** <meta name="description"> — must be unique across the site. */
  seoDescription: string;
  /** Extra search terms (synonyms, formats, common misspellings). */
  keywords: string[];
  icon: LucideIcon;
  status: ToolStatus;
  featured?: boolean;
  /** ISO date the tool went live. Used for "recently added" — real data only. */
  addedAt: string;
  /** Hand-picked related tools; padded with same-category tools automatically. */
  related: string[];
}

export const categories: Category[] = [
  { slug: "json-tools", name: "JSON Tools", description: "Format, validate, compare and visualize JSON documents.", icon: Braces },
  { slug: "encoding", name: "Encoding Tools", description: "Encode and decode Base64 and URL-encoded text.", icon: Binary },
  { slug: "code-tools", name: "Code Tools", description: "Test regular expressions, format HTML and generate identifiers.", icon: Code2 },
  { slug: "security", name: "Security Tools", description: "Inspect JWTs and compute cryptographic hashes locally.", icon: ShieldCheck },
  { slug: "date-time", name: "Date & Time Tools", description: "Convert between Unix timestamps and human-readable dates.", icon: Clock },
  { slug: "devops", name: "DevOps Tools", description: "Build cron schedules and format YAML configuration.", icon: Server },
];

export const tools: Tool[] = [
  {
    slug: "json-formatter",
    name: "JSON Formatter & Validator",
    category: "json-tools",
    description: "Format, minify, validate and flatten JSON with precise error locations.",
    seoTitle: "JSON Formatter & Validator — Beautify, Minify & Flatten JSON",
    seoDescription:
      "Free online JSON formatter and validator. Beautify or minify JSON, find syntax errors by line and column, and flatten nested objects. Runs entirely in your browser.",
    keywords: ["json", "beautify", "pretty print", "minify", "validate", "lint", "flatten", "parser"],
    icon: FileJson,
    status: "live",
    featured: true,
    addedAt: "2026-11-23",
    related: ["json-diff", "json-yaml-tree", "yaml-formatter"],
  },
  {
    slug: "base64-encoder-decoder",
    name: "Base64 Encoder / Decoder",
    category: "encoding",
    description: "Encode text to Base64 and decode Base64 back to text, with full Unicode support.",
    seoTitle: "Base64 Encoder / Decoder — Encode & Decode Base64 Online",
    seoDescription:
      "Encode text to Base64 or decode Base64 to text with UTF-8 Unicode support and URL-safe mode. Private, instant and processed locally in your browser.",
    keywords: ["base64", "encode", "decode", "btoa", "atob", "base64url", "utf-8"],
    icon: Binary,
    status: "live",
    featured: true,
    addedAt: "2026-11-23",
    related: ["url-encoder-decoder", "jwt-decoder", "hash-generator"],
  },
  {
    slug: "uuid-generator",
    name: "UUID Generator",
    category: "code-tools",
    description: "Generate cryptographically secure UUID v4 values in bulk.",
    seoTitle: "UUID v4 Generator — Generate Secure Random UUIDs in Bulk",
    seoDescription:
      "Generate one or thousands of RFC 9562 UUID v4 values using your browser's cryptographically secure random generator. Copy or download as a text file.",
    keywords: ["uuid", "guid", "v4", "random", "identifier", "unique id"],
    icon: Fingerprint,
    status: "live",
    featured: true,
    addedAt: "2026-11-23",
    related: ["hash-generator", "unix-timestamp-converter", "base64-encoder-decoder"],
  },
  {
    slug: "jwt-decoder",
    name: "JWT Decoder",
    category: "security",
    description: "Decode a JSON Web Token's header and payload and inspect its expiry claims.",
    seoTitle: "JWT Decoder — Decode JSON Web Token Header & Claims",
    seoDescription:
      "Decode JWT header and payload, read exp, iat and nbf claims as dates, and spot expired tokens. Tokens never leave your browser. Decoding does not verify signatures.",
    keywords: ["jwt", "json web token", "decode", "claims", "bearer", "token", "exp", "jws"],
    icon: KeyRound,
    status: "live",
    featured: true,
    addedAt: "2026-11-23",
    related: ["base64-encoder-decoder", "unix-timestamp-converter", "json-formatter"],
  },
  {
    slug: "url-encoder-decoder",
    name: "URL Encoder / Decoder",
    category: "encoding",
    description: "Percent-encode and decode URL components, including Unicode characters.",
    seoTitle: "URL Encoder / Decoder — Percent-Encode URL Components",
    seoDescription:
      "Encode or decode URL components and query strings using standard percent-encoding with Unicode support. Clear errors for malformed input. Runs locally.",
    keywords: ["url", "uri", "percent encoding", "encodeURIComponent", "decodeURIComponent", "query string", "escape"],
    icon: Link2,
    status: "live",
    addedAt: "2026-11-23",
    related: ["base64-encoder-decoder", "html-formatter", "regex-tester"],
  },
  {
    slug: "regex-tester",
    name: "Regex Tester",
    category: "code-tools",
    description: "Test JavaScript regular expressions with live match highlighting and capture groups.",
    seoTitle: "Regex Tester — Test JavaScript Regular Expressions Online",
    seoDescription:
      "Test JavaScript regular expressions against sample text with live highlighting, match counts, capture groups and flags. Protected against runaway patterns.",
    keywords: ["regex", "regexp", "regular expression", "pattern", "match", "test", "capture group"],
    icon: Regex,
    status: "live",
    featured: true,
    addedAt: "2026-11-23",
    related: ["url-encoder-decoder", "html-formatter", "json-formatter"],
  },
  {
    slug: "unix-timestamp-converter",
    name: "Unix Timestamp Converter",
    category: "date-time",
    description: "Convert Unix timestamps (seconds or milliseconds) to dates and back.",
    seoTitle: "Unix Timestamp Converter — Epoch to Date & Date to Epoch",
    seoDescription:
      "Convert Unix epoch timestamps in seconds or milliseconds to UTC, local time and ISO 8601 — or convert a date back to a timestamp. Free and browser-based.",
    keywords: ["unix", "epoch", "timestamp", "date", "time", "iso 8601", "utc", "milliseconds", "seconds"],
    icon: Clock,
    status: "live",
    featured: true,
    addedAt: "2026-11-23",
    related: ["cron-generator", "jwt-decoder", "uuid-generator"],
  },
  {
    slug: "json-diff",
    name: "JSON Diff Checker",
    category: "json-tools",
    description: "Compare two JSON documents and see added, removed and changed values by path.",
    seoTitle: "JSON Diff Checker — Compare Two JSON Documents Online",
    seoDescription:
      "Compare two JSON documents structurally. See added, removed and changed properties by path, ignoring whitespace and key order. Processed in your browser.",
    keywords: ["json", "diff", "compare", "difference", "changes", "deep equal"],
    icon: GitCompare,
    status: "live",
    addedAt: "2026-11-23",
    related: ["json-formatter", "json-yaml-tree", "yaml-formatter"],
  },
  {
    slug: "cron-generator",
    name: "Cron Expression Generator",
    category: "devops",
    description: "Build standard 5-field cron expressions visually and read them in plain English.",
    seoTitle: "Cron Expression Generator — Build & Explain Cron Schedules",
    seoDescription:
      "Build standard 5-field cron expressions with a visual editor, get a plain-English explanation and preview upcoming run times. Supports Vixie/POSIX cron syntax.",
    keywords: ["cron", "crontab", "schedule", "expression", "job", "linux", "kubernetes cronjob"],
    icon: CalendarClock,
    status: "live",
    addedAt: "2026-11-23",
    related: ["unix-timestamp-converter", "yaml-formatter", "regex-tester"],
  },
  {
    slug: "html-formatter",
    name: "HTML Formatter / Minifier",
    category: "code-tools",
    description: "Beautify HTML with configurable indentation, or minify it safely.",
    seoTitle: "HTML Formatter & Minifier — Beautify or Compress HTML",
    seoDescription:
      "Format HTML with 2-space, 4-space or tab indentation using Prettier, or minify it conservatively without changing content. Your HTML is never executed.",
    keywords: ["html", "format", "beautify", "pretty print", "minify", "compress", "indent", "prettier"],
    icon: FileCode,
    status: "live",
    addedAt: "2026-11-23",
    related: ["url-encoder-decoder", "regex-tester", "json-formatter"],
  },
  {
    slug: "yaml-formatter",
    name: "YAML Formatter / Validator",
    category: "devops",
    description: "Validate and re-format YAML with clear parser errors and safe parsing.",
    seoTitle: "YAML Formatter & Validator — Check and Format YAML Online",
    seoDescription:
      "Validate YAML and get line-accurate parser errors, then re-format it with consistent indentation. Uses a safe YAML 1.2 parser — no code execution.",
    keywords: ["yaml", "yml", "validate", "format", "lint", "kubernetes", "docker compose", "config"],
    icon: FileText,
    status: "live",
    featured: true,
    addedAt: "2026-11-23",
    related: ["json-yaml-tree", "json-formatter", "cron-generator"],
  },
  {
    slug: "json-yaml-tree",
    name: "JSON/YAML Tree Visualizer",
    category: "json-tools",
    description: "Render JSON or YAML — data or JSON Schema — as a copyable text tree.",
    seoTitle: "JSON & YAML Tree Visualizer — ASCII Tree for Data and JSON Schema",
    seoDescription:
      "Turn JSON or YAML into a readable ASCII/Unicode tree. Detects JSON Schema automatically and shows types, required fields and constraints. Copy or download.",
    keywords: ["json", "yaml", "tree", "visualize", "ascii tree", "json schema", "structure", "outline"],
    icon: ListTree,
    status: "live",
    addedAt: "2026-11-23",
    related: ["json-formatter", "yaml-formatter", "json-diff"],
  },
  {
    slug: "hash-generator",
    name: "Hash Generator",
    category: "security",
    description: "Compute SHA-1, SHA-256, SHA-384 and SHA-512 hashes of text or files.",
    seoTitle: "Hash Generator — SHA-256, SHA-512, SHA-1 Checksums Online",
    seoDescription:
      "Generate SHA-256, SHA-384, SHA-512 and SHA-1 hashes of text or files using the Web Crypto API. Nothing is uploaded. Not intended for password storage.",
    keywords: ["hash", "sha256", "sha-256", "sha512", "sha1", "checksum", "digest", "web crypto"],
    icon: Hash,
    status: "live",
    addedAt: "2026-11-23",
    related: ["jwt-decoder", "base64-encoder-decoder", "uuid-generator"],
  },
];

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

export const liveTools = (): Tool[] => tools.filter((t) => t.status === "live");

export function getTool(slug: string): Tool | undefined {
  return liveTools().find((t) => t.slug === slug);
}

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function toolsInCategory(slug: CategorySlug): Tool[] {
  return liveTools().filter((t) => t.category === slug);
}

/** Categories that currently contain at least one live tool. */
export function activeCategories(): Category[] {
  return categories.filter((c) => toolsInCategory(c.slug).length > 0);
}

export function featuredTools(): Tool[] {
  return liveTools().filter((t) => t.featured);
}

export function recentlyAdded(limit = 6): Tool[] {
  return [...liveTools()].sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, limit);
}

export function relatedTools(slug: string, limit = 4): Tool[] {
  const tool = getTool(slug);
  if (!tool) return [];
  const picked = new Map<string, Tool>();
  for (const s of tool.related) {
    const t = getTool(s);
    if (t && t.slug !== slug) picked.set(t.slug, t);
  }
  for (const t of toolsInCategory(tool.category)) {
    if (t.slug !== slug) picked.set(t.slug, t);
  }
  return [...picked.values()].slice(0, limit);
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
}

/**
 * Ranked search over name, description, keywords and category name.
 * Every query token must match somewhere; name matches rank highest.
 */
export function searchTools(query: string, pool: Tool[] = liveTools()): Tool[] {
  const tokens = normalize(query).split(/[\s/,]+/).filter(Boolean);
  if (tokens.length === 0) return pool;
  const scored: { tool: Tool; score: number }[] = [];
  for (const tool of pool) {
    const name = normalize(tool.name);
    const slug = tool.slug;
    const desc = normalize(tool.description);
    const kw = tool.keywords.map(normalize);
    const cat = normalize(getCategory(tool.category)?.name ?? "");
    let score = 0;
    let all = true;
    for (const tok of tokens) {
      let s = 0;
      if (name.startsWith(tok)) s = Math.max(s, 10);
      if (name.split(/\W+/).some((w) => w.startsWith(tok))) s = Math.max(s, 8);
      if (slug.includes(tok)) s = Math.max(s, 6);
      if (kw.some((k) => k === tok)) s = Math.max(s, 6);
      if (kw.some((k) => k.includes(tok))) s = Math.max(s, 4);
      if (cat.includes(tok)) s = Math.max(s, 2);
      if (desc.includes(tok)) s = Math.max(s, 2);
      if (s === 0) {
        all = false;
        break;
      }
      score += s;
    }
    if (all) scored.push({ tool, score });
  }
  return scored.sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name)).map((x) => x.tool);
}
