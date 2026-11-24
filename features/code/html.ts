/**
 * HTML formatting and minification. Input is treated purely as text: it is
 * never inserted into the DOM, so submitted scripts cannot execute.
 */

export type HtmlIndent = 2 | 4 | "tab";
export type HtmlResult = { ok: true; value: string } | { ok: false; error: string };

/** Format with Prettier (loaded on demand so it never weighs on initial page load). */
export async function formatHtml(input: string, indent: HtmlIndent = 2, printWidth = 100): Promise<HtmlResult> {
  if (input.trim() === "") return { ok: false, error: "Input is empty." };
  const [prettier, html, postcss, babel, estree] = await Promise.all([
    import("prettier/standalone"),
    import("prettier/plugins/html"),
    import("prettier/plugins/postcss"),
    import("prettier/plugins/babel"),
    import("prettier/plugins/estree"),
  ]);
  try {
    const value = await prettier.format(input, {
      parser: "html",
      plugins: [html, postcss, babel, estree],
      useTabs: indent === "tab",
      tabWidth: indent === "tab" ? 2 : indent,
      printWidth,
      // "css" respects default CSS display, so whitespace-sensitive inline content isn't altered.
      htmlWhitespaceSensitivity: "css",
    });
    return { ok: true, value };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Prettier appends a code frame; the first line is the useful part.
    return { ok: false, error: msg.split("\n")[0] };
  }
}

const RAW_TEXT = /<(pre|textarea|script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;

/** Block-level elements around which inter-tag whitespace is never rendered. */
const BLOCK = new Set(
  "html head body title meta link base script style noscript template div p ul ol li dl dt dd table thead tbody tfoot tr td th caption colgroup col section article aside header footer nav main h1 h2 h3 h4 h5 h6 form fieldset legend figure figcaption blockquote hr br address details summary dialog option optgroup select".split(
    " ",
  ),
);

function tagName(fragment: string): string | null {
  const m = /^<\/?([a-zA-Z][\w:-]*)/.exec(fragment);
  return m ? m[1].toLowerCase() : null;
}

/**
 * Conservative minifier:
 *  - removes comments (keeps IE conditional comments),
 *  - collapses runs of whitespace to a single space,
 *  - drops whitespace only next to block-level tags, where browsers ignore it,
 *  - leaves <pre>, <textarea>, <script> and <style> contents byte-for-byte intact.
 * Attribute values and text content are otherwise unchanged.
 */
export function minifyHtml(input: string): HtmlResult {
  if (input.trim() === "") return { ok: false, error: "Input is empty." };

  // Protect raw-text elements with placeholders.
  const preserved: string[] = [];
  let s = input.replace(RAW_TEXT, (m) => {
    preserved.push(m);
    return `\u0000${preserved.length - 1}\u0000`;
  });

  s = s.replace(/<!--(?!\[if)[\s\S]*?-->/g, "");

  // Tokenise into tags and text; collapse whitespace inside text runs.
  const tokens = s.split(/(<[^>]*>|\u0000\d+\u0000)/g).filter((t) => t !== "");
  const out: string[] = [];
  const isBlockToken = (t: string | undefined) => {
    if (!t) return true; // document start/end
    if (/^\u0000\d+\u0000$/.test(t)) {
      const name = tagName(preserved[Number(t.slice(1, -1))]);
      return name !== null && BLOCK.has(name);
    }
    if (t.startsWith("<!") || t.startsWith("<?")) return true;
    const name = tagName(t);
    return name !== null && BLOCK.has(name);
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.startsWith("<") || t.startsWith("\u0000")) {
      // Collapse whitespace between attributes, but not inside quoted values.
      out.push(t.startsWith("<") && !t.startsWith("<!--") ? collapseTag(t) : t);
      continue;
    }
    let text = t.replace(/\s+/g, " ");
    if (text === " ") {
      if (isBlockToken(tokens[i - 1]) || isBlockToken(tokens[i + 1])) continue;
    } else {
      if (isBlockToken(tokens[i - 1])) text = text.replace(/^ /, "");
      if (isBlockToken(tokens[i + 1])) text = text.replace(/ $/, "");
    }
    out.push(text);
  }

  const value = out.join("").replace(/\u0000(\d+)\u0000/g, (_, i) => preserved[Number(i)]);
  return { ok: true, value };
}

function collapseTag(tag: string): string {
  let out = "";
  let quote: string | null = null;
  let prevSpace = false;
  for (const ch of tag) {
    if (quote) {
      out += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      out += ch;
      prevSpace = false;
      continue;
    }
    if (/\s/.test(ch)) {
      if (!prevSpace) out += " ";
      prevSpace = true;
      continue;
    }
    prevSpace = false;
    out += ch;
  }
  return out.replace(/ (\/?>)$/, "$1");
}
