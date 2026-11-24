import type { ToolContent } from "../types";

export const content: ToolContent = {
  intro: [
    "Large JSON and YAML documents are hard to grasp at a glance. This tool renders them as a compact text tree — like the output of the `tree` command — that you can paste into documentation, pull requests, tickets or chat.",
    "It automatically detects **JSON Schema** documents and shows each property's type, whether it is required, and constraints like `minLength`, `enum` or `format`.",
  ],
  howTo: [
    "Paste JSON or YAML. The format is detected automatically (JSON first, then YAML).",
    "The tool decides whether the input is a JSON Schema or plain data and shows why. Override the mode if needed.",
    "Choose Unicode (`├──`) or plain ASCII (`|--`) drawing characters.",
    "Copy the tree or download it as a `.txt` file.",
  ],
  examples: [
    { title: "Data payload", input: '{"user":{"name":"Ada","roles":["admin"]}}', output: 'root {object · 1}\n└── user {object · 2}\n    ├── name: "Ada" (string)\n    └── roles [array · 1]\n        └── [0]: "admin" (string)' },
    {
      title: "JSON Schema",
      input: '{"type":"object","required":["id"],"properties":{"id":{"type":"integer","minimum":1},"email":{"type":"string","format":"email"}}}',
      output: "root: object\n├── id: integer (required) [minimum: 1]\n└── email: string [format: email]",
    },
  ],
  sections: [
    {
      heading: "How schema detection works",
      bullets: [
        "A `$schema` URI pointing at json-schema.org marks the input as a schema.",
        "Otherwise, a valid JSON Schema `type` together with schema-shaped `properties` or `items` is treated as a schema.",
        "Objects that merely contain a field called `type` (e.g. `{\"type\": \"user\"}`) are treated as data.",
        "References (`$ref`) are shown, not resolved. `$defs`/`definitions`, `oneOf`, `anyOf` and `allOf` appear as branches.",
      ],
    },
  ],
  faqs: [
    { q: "Is OpenAPI supported?", a: "Paste a schema object from `components.schemas` and it will render as a schema. A complete OpenAPI document is rendered as data." },
    { q: "How big can the tree get?", a: "Up to 5,000 nodes and 64 levels deep; larger structures are truncated with a “… more” marker so the page stays fast." },
    { q: "Is my input uploaded?", a: "No. Parsing and rendering happen in your browser." },
  ],
};
