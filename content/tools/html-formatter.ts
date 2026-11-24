import type { ToolContent } from "../types";

export const content: ToolContent = {
  intro: [
    "Minified or machine-generated HTML is hard to read and review. This tool re-indents HTML with consistent structure using **Prettier**, or minifies it to reduce page weight.",
    "Your HTML is treated strictly as text — it is **never rendered or executed**, so pasting untrusted markup with scripts is safe.",
  ],
  howTo: [
    "Paste HTML into the input editor.",
    "Choose indentation: 2 spaces, 4 spaces or tabs.",
    "Click **Format** to beautify or **Minify** to compress.",
    "Copy the result. If the markup is malformed, you'll see the parser's error and location.",
  ],
  examples: [
    { title: "Format", input: "<ul><li><a href=\"/\">Home</a></li><li>About</li></ul>", output: "<ul>\n  <li><a href=\"/\">Home</a></li>\n  <li>About</li>\n</ul>" },
    { title: "Minify", input: "<div>\n  <!-- nav -->\n  <p>Hello   world</p>\n</div>", output: "<div><p>Hello world</p></div>" },
  ],
  sections: [
    {
      heading: "What the minifier changes (and what it doesn't)",
      bullets: [
        "Removes HTML comments (conditional comments `<!--[if …]>` are kept).",
        "Collapses runs of whitespace in text to a single space, and removes whitespace next to block-level elements where browsers ignore it.",
        "Leaves `<pre>`, `<textarea>`, `<script>` and `<style>` contents exactly as written.",
        "Does not remove optional tags, quotes or attributes — the output stays readable and semantically identical.",
      ],
    },
  ],
  faqs: [
    { q: "Will formatting change how my page looks?", a: "Formatting uses whitespace-sensitive rules based on each element's default CSS display, so inline content isn't broken apart. Pages that change `display` or `white-space` with custom CSS can still be affected in rare cases." },
    { q: "Are embedded CSS and JavaScript formatted?", a: "Yes. Contents of `<style>` and `<script>` tags are formatted with Prettier's CSS and JavaScript formatters." },
    { q: "Is my HTML executed or uploaded?", a: "Neither. Processing happens in your browser on plain text; nothing is inserted into the page and nothing is sent to a server." },
  ],
  privacy: "HTML is processed as text in your browser and is never rendered, executed or uploaded.",
};
