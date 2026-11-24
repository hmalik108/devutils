import type { ToolContent } from "../types";

export const content: ToolContent = {
  intro: [
    "Regular expressions describe text patterns for searching, validating and extracting data. A small mistake — a missing escape or a greedy quantifier — can make a pattern match far more or far less than intended.",
    "This tester runs your pattern with the **JavaScript (ECMAScript) regex engine** used by browsers and Node.js, highlights every match, lists capture groups and counts results as you type.",
  ],
  howTo: [
    "Enter a pattern without surrounding slashes, e.g. `\\d{3}-\\d{4}`.",
    "Toggle flags: `g` (all matches), `i` (ignore case), `m` (multiline `^`/`$`), `s` (dot matches newlines), `u` (Unicode) and others.",
    "Type or paste test text. Matches are highlighted and listed with their position and capture groups.",
    "Pick a **sample pattern** to start from a working example.",
  ],
  examples: [
    { title: "Extract ISO dates with named groups", input: "(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})", output: "2026-11-23 → year=2026, month=11, day=23" },
    { title: "Case-insensitive word match", input: "\\bcolou?r\\b  (flags: gi)", output: "Matches “color”, “Colour”, “COLOR”" },
  ],
  sections: [
    {
      heading: "Regular expression basics",
      bullets: [
        "`.` any character · `\\d` digit · `\\w` word character · `\\s` whitespace",
        "`*` 0 or more · `+` 1 or more · `?` optional · `{2,5}` between 2 and 5",
        "`^` start · `$` end · `\\b` word boundary",
        "`[abc]` character class · `(…)` capture group · `(?<name>…)` named group · `(?:…)` non-capturing group",
        "`a|b` alternation · `(?=…)` lookahead · `(?<=…)` lookbehind",
      ],
    },
    {
      heading: "Protection against runaway patterns",
      paragraphs: [
        "Some patterns, such as `(a+)+$`, take exponential time on certain inputs (“catastrophic backtracking”). Matching runs in a background Web Worker with a time limit; if a pattern takes too long, it is stopped and you'll see a warning instead of a frozen tab. Results are capped at 10,000 matches.",
      ],
    },
  ],
  faqs: [
    { q: "Which regex flavor does this use?", a: "JavaScript (ECMAScript) regular expressions, as implemented by your browser. Syntax such as possessive quantifiers or atomic groups from PCRE, Python or Java may not be supported." },
    { q: "Why does only one match appear?", a: "Without the `g` (global) flag, JavaScript stops at the first match. Enable `g` to find all matches." },
    { q: "Do I need to escape forward slashes?", a: "No. Enter the pattern as you would pass it to `new RegExp(...)`. Slashes only need escaping inside a `/regex/` literal in source code." },
    { q: "Why did my pattern time out?", a: "It probably contains nested quantifiers that cause catastrophic backtracking. Make quantifiers more specific (e.g. `[^,]*` instead of `.*`) or remove nested repetition." },
  ],
};
