import type { ToolContent } from "../types";

export const content: ToolContent = {
  intro: [
    "YAML is the configuration language of Kubernetes, Docker Compose, GitHub Actions, Ansible and OpenAPI. Its reliance on indentation means one misplaced space can change meaning or break a deployment.",
    "This tool validates YAML, reports parser errors with line and column, and re-formats documents with consistent indentation while **preserving comments, key order, anchors and value types**.",
  ],
  howTo: [
    "Paste YAML into the editor or load the sample.",
    "Choose 2- or 4-space indentation.",
    "Click **Format** (or **Validate** to check without reformatting).",
    "Fix any reported errors, then copy the result.",
  ],
  examples: [
    { title: "Normalise indentation", input: "services:\n    web:\n         image: nginx\n         ports:\n         - \"80:80\"", output: "services:\n  web:\n    image: nginx\n    ports:\n      - \"80:80\"" },
    { title: "Common error: tab indentation", input: "key:\n\tvalue: 1", output: "Tabs are not allowed as indentation" },
  ],
  sections: [
    {
      heading: "Parser behavior",
      bullets: [
        "Parses **YAML 1.2** using the core schema with the open-source `yaml` library.",
        "`yes`/`no`/`on`/`off` are strings in YAML 1.2 (they were booleans in YAML 1.1). Quote values when in doubt.",
        "Multi-document streams separated by `---` are supported.",
        "Duplicate keys are reported as errors.",
        "**Safe parsing:** custom tags such as `!!python/object` are never constructed — unknown tags produce a warning and the value is treated as plain data. Alias expansion is limited to prevent “billion laughs” attacks.",
      ],
    },
  ],
  faqs: [
    { q: "Does formatting change my data?", a: "No. The document is round-tripped through its syntax tree, so values, types, comments and key order are preserved; only indentation and spacing are normalised. Long strings are not re-wrapped." },
    { q: "Why does my file fail with a tab error?", a: "YAML forbids tab characters for indentation. Replace tabs with spaces." },
    { q: "Can I convert YAML to JSON?", a: "Use the [JSON/YAML Tree Visualizer](/json-yaml-tree) to inspect structure, or paste data into the [JSON Formatter](/json-formatter) once converted." },
  ],
};
