import type { ToolContent } from "../types";

export const content: ToolContent = {
  intro: [
    "JSON (JavaScript Object Notation) is the most common format for APIs, configuration files and logs. Minified JSON is hard to read, and a single missing comma can break a deployment.",
    "This formatter pretty-prints JSON with your choice of indentation, minifies it for transport, validates it against the JSON specification (RFC 8259) and pinpoints syntax errors by line and column. It can also **flatten** deeply nested objects into single-level `path: value` pairs — handy for spreadsheets, environment variables or diffing.",
  ],
  howTo: [
    "Paste or type JSON into the input editor, or click **Sample** to load an example.",
    "Click **Format** to beautify, **Minify** to remove whitespace, or **Flatten** to convert nested structures to dotted paths.",
    "If the JSON is invalid, read the error message — it shows what was expected and where (line and column).",
    "Use **Copy** or **Download** to take the result with you.",
  ],
  examples: [
    { title: "Beautify", input: '{"user":{"id":7,"roles":["admin","dev"]}}', output: '{\n  "user": {\n    "id": 7,\n    "roles": [\n      "admin",\n      "dev"\n    ]\n  }\n}' },
    { title: "Flatten nested objects", input: '{"db":{"host":"localhost","ports":[5432,5433]}}', output: '{\n  "db.host": "localhost",\n  "db.ports[0]": 5432,\n  "db.ports[1]": 5433\n}' },
    { title: "Common error: trailing comma", description: "JSON does not allow a comma after the last item.", input: '{"a": 1, "b": 2,}', output: "Trailing comma before } — line 1, column 17" },
  ],
  sections: [
    {
      heading: "What counts as valid JSON?",
      bullets: [
        "Property names and strings must use double quotes: `\"name\"`, not `'name'`.",
        "No trailing commas, comments, `undefined`, `NaN` or `Infinity`.",
        "Numbers cannot have leading zeros (`01`) or a trailing decimal point (`1.`).",
        "Control characters such as raw line breaks inside strings must be escaped (`\\n`).",
      ],
    },
    {
      heading: "How flattening works",
      paragraphs: [
        "Object keys are joined with dots (`a.b.c`) and array items use brackets (`items[0]`). Keys that aren't valid identifiers are quoted (`[\"content-type\"]`). Empty objects and arrays are kept as values so nothing is lost.",
      ],
    },
  ],
  faqs: [
    { q: "Is my JSON uploaded to a server?", a: "No. Parsing, formatting and validation happen in your browser with JavaScript. Large documents are processed in a Web Worker so the page stays responsive." },
    { q: "Why does my JSON with comments fail validation?", a: "Comments are not part of the JSON standard. Formats like JSONC or JSON5 allow them, but standard parsers (including `JSON.parse`) reject them. Remove the comments, or use the [YAML Formatter](/yaml-formatter) if your file is really YAML." },
    { q: "Does formatting change my data?", a: "No. Formatting only changes whitespace. Key order is preserved unless you enable **Sort keys**. Note that numbers beyond JavaScript's safe integer range (2^53) may lose precision, as with any JavaScript-based parser." },
    { q: "How large a file can I format?", a: "Up to 5 MB of text. Larger inputs are rejected to keep the browser tab responsive." },
  ],
};
