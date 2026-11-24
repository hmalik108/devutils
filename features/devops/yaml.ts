import { parseAllDocuments, type Document, type DocumentOptions, type ParseOptions, type SchemaOptions, type YAMLError } from "yaml";

/**
 * YAML handling uses the `yaml` package with a deliberately safe setup:
 *  - YAML 1.2 "core" schema only (no custom/language-specific tags, so no object
 *    construction or code execution like PyYAML's unsafe loaders),
 *  - alias expansion capped (defends against "billion laughs"),
 *  - duplicate keys are errors.
 */
const PARSE_OPTIONS: ParseOptions & DocumentOptions & SchemaOptions = {
  version: "1.2",
  schema: "core",
  customTags: [],
  uniqueKeys: true,
  prettyErrors: true,
  strict: true,
};

const MAX_ALIAS_COUNT = 100;

export interface YamlIssue {
  message: string;
  line?: number;
  column?: number;
  code?: string;
}

function toIssue(e: YAMLError): YamlIssue {
  const first = e.message.split("\n")[0].replace(/ at line \d+, column \d+:?$/, "");
  return { message: first, line: e.linePos?.[0]?.line, column: e.linePos?.[0]?.col, code: e.code };
}

function parseDocs(text: string): { docs: Document.Parsed[]; errors: YamlIssue[]; warnings: YamlIssue[] } {
  const docs = parseAllDocuments(text, PARSE_OPTIONS);
  // parseAllDocuments returns an EmptyStream (array-like) when input is empty.
  const list = (Array.isArray(docs) ? docs : []) as Document.Parsed[];
  const errors = list.flatMap((d) => d.errors.map(toIssue));
  const warnings = list.flatMap((d) => d.warnings.map(toIssue));
  return { docs: list, errors, warnings };
}

export type YamlParseResult =
  | { ok: true; value: unknown; documents: number; warnings: YamlIssue[] }
  | { ok: false; errors: YamlIssue[] };

/** Parse YAML to plain JS. Multiple documents produce an array. */
export function parseYamlSafe(text: string): YamlParseResult {
  if (text.trim() === "") return { ok: false, errors: [{ message: "Input is empty." }] };
  let parsed;
  try {
    parsed = parseDocs(text);
  } catch (e) {
    return { ok: false, errors: [{ message: e instanceof Error ? e.message : String(e) }] };
  }
  if (parsed.errors.length) return { ok: false, errors: parsed.errors };
  try {
    const values = parsed.docs.map((d) => d.toJS({ maxAliasCount: MAX_ALIAS_COUNT }));
    return {
      ok: true,
      value: values.length === 1 ? values[0] : values,
      documents: values.length,
      warnings: parsed.warnings,
    };
  } catch (e) {
    // e.g. "Excessive alias count indicates a resource exhaustion attack"
    return { ok: false, errors: [{ message: e instanceof Error ? e.message : String(e) }] };
  }
}

export interface YamlFormatOptions {
  indent?: 2 | 4;
  /** Re-indent block sequences under their parent key (`key:\n  - a`). */
  indentSeq?: boolean;
}

export type YamlFormatResult =
  | { ok: true; value: string; documents: number; warnings: YamlIssue[] }
  | { ok: false; errors: YamlIssue[] };

/**
 * Re-serialize YAML with consistent indentation. Comments, key order, anchors
 * and scalar types are preserved because we round-trip the document AST
 * rather than plain JS values.
 */
export function formatYaml(text: string, opts: YamlFormatOptions = {}): YamlFormatResult {
  if (text.trim() === "") return { ok: false, errors: [{ message: "Input is empty." }] };
  let parsed;
  try {
    parsed = parseDocs(text);
  } catch (e) {
    return { ok: false, errors: [{ message: e instanceof Error ? e.message : String(e) }] };
  }
  if (parsed.errors.length) return { ok: false, errors: parsed.errors };
  try {
    // Resolve aliases once to enforce the alias budget even when only formatting.
    for (const d of parsed.docs) d.toJS({ maxAliasCount: MAX_ALIAS_COUNT });
    const out = parsed.docs
      .map((d, i) => {
        const s = d.toString({ indent: opts.indent ?? 2, indentSeq: opts.indentSeq ?? true, lineWidth: 0 });
        return i > 0 && !s.startsWith("---") ? `---\n${s}` : s;
      })
      .join("");
    return { ok: true, value: out, documents: parsed.docs.length, warnings: parsed.warnings };
  } catch (e) {
    return { ok: false, errors: [{ message: e instanceof Error ? e.message : String(e) }] };
  }
}
