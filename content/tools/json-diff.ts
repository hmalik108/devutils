import type { ToolContent } from "../types";

export const content: ToolContent = {
  intro: [
    "Comparing JSON line by line is noisy: reordered keys or different indentation show up as changes even when the data is identical. This tool compares JSON **structurally** — it parses both documents and reports only real differences, each with its exact path.",
    "Use it to review API response changes, compare configuration between environments or check test fixtures.",
  ],
  howTo: [
    "Paste the original JSON on the left and the modified JSON on the right (or load the sample).",
    "Click **Compare**. Each input is validated independently, with errors shown under the side that failed.",
    "Review the differences: **added** (+), **removed** (−) and **changed** (~), each with its path such as `user.roles[1]`.",
    "Copy or download the report as text.",
  ],
  examples: [
    {
      title: "Detecting changes",
      input: 'Left:  {"name":"api","version":1,"tags":["a","b"]}\nRight: {"version":2,"name":"api","tags":["a"],"public":true}',
      output: '~ version: 1 → 2\n- tags[1]: "b"\n+ public: true',
    },
  ],
  sections: [
    {
      heading: "How the comparison works",
      bullets: [
        "Whitespace, indentation and object key order are ignored.",
        "Arrays are compared by position: inserting an item at the start reports every following item as changed.",
        "A type change (e.g. `\"1\"` → `1`) is reported as a change.",
        "Up to 5,000 differences are listed.",
      ],
    },
  ],
  faqs: [
    { q: "Why are my files reported as equivalent when the text differs?", a: "Only data is compared. Differences in formatting or key order don't change the meaning of JSON, so they aren't reported." },
    { q: "Can it compare very large files?", a: "Yes, up to 5 MB per side. Large comparisons run in a Web Worker so the page stays responsive." },
    { q: "Is my data uploaded?", a: "No. Both documents are parsed and compared in your browser." },
  ],
};
