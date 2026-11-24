import type { ToolContent } from "../types";

export const content: ToolContent = {
  intro: [
    "A UUID (Universally Unique Identifier) is a 128-bit value used as a database key, request ID, file name or idempotency key. Version 4 UUIDs are generated from random numbers, so they can be created anywhere without coordination.",
    "This generator uses your browser's **cryptographically secure** random number generator (`crypto.randomUUID()` / `crypto.getRandomValues()`). It never uses `Math.random()`, which is predictable and unsuitable for identifiers.",
  ],
  howTo: [
    "Set how many UUIDs you need (1–1,000).",
    "Optionally choose uppercase, remove hyphens or wrap values in braces.",
    "Click **Generate**. Copy a single value with its copy button, copy them all, or download a `.txt` file with one UUID per line.",
  ],
  examples: [
    { title: "Standard UUID v4", output: "3f2b8c1e-9d4a-4e7b-a1c6-5f0e2d9b7a34" },
    { title: "Uppercase without hyphens", output: "3F2B8C1E9D4A4E7BA1C65F0E2D9B7A34" },
  ],
  sections: [
    {
      heading: "Anatomy of a UUID v4",
      paragraphs: [
        "A UUID is written as 32 hex digits in five groups: `xxxxxxxx-xxxx-4xxx-Nxxx-xxxxxxxxxxxx`. The `4` marks version 4 and `N` is always `8`, `9`, `a` or `b` (the RFC 9562 variant). The other 122 bits are random.",
      ],
    },
    {
      heading: "UUID vs GUID",
      paragraphs: [
        "GUID (Globally Unique Identifier) is Microsoft's name for the same thing. A GUID is a UUID; Windows tools often display them in uppercase and wrapped in braces, like `{3F2B8C1E-9D4A-4E7B-A1C6-5F0E2D9B7A34}` — use the formatting options to match.",
      ],
    },
  ],
  faqs: [
    { q: "Can two generated UUIDs collide?", a: "In practice, no. With 122 random bits you would need to generate about 2.7 quintillion UUIDs to have a 50% chance of a single duplicate." },
    { q: "Should I use UUID v4 or v7 as a database key?", a: "v4 is fully random, which can fragment B-tree indexes on very large tables. UUID v7 embeds a timestamp and sorts by creation time. This tool currently generates v4, the most widely supported version." },
    { q: "Are these UUIDs secure enough for tokens?", a: "They are generated with a CSPRNG, so they are unpredictable. However, for secrets such as session tokens or password-reset links, a dedicated random token of at least 128 bits is clearer about intent." },
    { q: "Are generated values stored?", a: "No. UUIDs exist only in this page's memory until you navigate away." },
  ],
};
