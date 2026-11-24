import { parseJson } from "./format";
import { parseYamlSafe } from "../devops/yaml";

export type InputFormat = "json" | "yaml";
export type TreeMode = "data" | "schema";

export type ParsedStructured =
  | { ok: true; value: unknown; format: InputFormat }
  | { ok: false; message: string; line?: number; column?: number };

/** Parse JSON first (strict), then fall back to YAML (a superset). */
export function parseStructured(text: string, prefer: "auto" | InputFormat = "auto"): ParsedStructured {
  if (text.trim() === "") return { ok: false, message: "Input is empty." };
  if (prefer !== "yaml") {
    const j = parseJson(text);
    if (j.ok) return { ok: true, value: j.value, format: "json" };
    if (prefer === "json") return { ok: false, ...j.error };
  }
  const y = parseYamlSafe(text);
  if (y.ok) return { ok: true, value: y.value, format: "yaml" };
  return { ok: false, message: y.errors[0].message, line: y.errors[0].line, column: y.errors[0].column };
}

const SCHEMA_TYPES = new Set(["object", "array", "string", "number", "integer", "boolean", "null"]);

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/**
 * Heuristic JSON Schema detection. Returns a reason so the UI can explain
 * its decision (and the user can override it).
 */
export function detectSchema(v: unknown): { isSchema: boolean; reason: string } {
  if (!isObj(v)) return { isSchema: false, reason: "Top level is not an object." };
  if (typeof v.$schema === "string" && /json-schema/i.test(v.$schema))
    return { isSchema: true, reason: "Found a JSON Schema $schema URI." };
  const t = v.type;
  const typeOk =
    (typeof t === "string" && SCHEMA_TYPES.has(t)) ||
    (Array.isArray(t) && t.length > 0 && t.every((x) => typeof x === "string" && SCHEMA_TYPES.has(x)));
  const props = v.properties;
  const propsLookLikeSchemas =
    isObj(props) && Object.values(props).length > 0 && Object.values(props).every((p) => isObj(p) || typeof p === "boolean");
  if (isObj(props) && !propsLookLikeSchemas) return { isSchema: false, reason: '"properties" holds plain values, so this is data.' };
  if (typeOk && propsLookLikeSchemas) return { isSchema: true, reason: 'Found "type" with schema-shaped "properties".' };
  if (typeOk && (isObj(v.items) || typeof v.items === "boolean") && t === "array")
    return { isSchema: true, reason: 'Found "type": "array" with an "items" schema.' };
  if ((isObj(v.$defs) || isObj(v.definitions)) && (typeOk || typeof v.$ref === "string"))
    return { isSchema: true, reason: 'Found "$defs"/"definitions" with a type or $ref.' };
  if (typeOk && Object.keys(v).every((k) => SCHEMA_KEYWORDS.has(k)))
    return { isSchema: true, reason: "All keys are JSON Schema keywords." };
  return { isSchema: false, reason: "No JSON Schema markers found; treating as data." };
}

const SCHEMA_KEYWORDS = new Set([
  "$schema", "$id", "$ref", "$defs", "$comment", "definitions", "title", "description", "type", "properties",
  "required", "items", "prefixItems", "additionalProperties", "patternProperties", "enum", "const", "default",
  "examples", "format", "pattern", "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf",
  "minLength", "maxLength", "minItems", "maxItems", "uniqueItems", "minProperties", "maxProperties", "oneOf",
  "anyOf", "allOf", "not", "nullable", "readOnly", "writeOnly", "deprecated",
]);

const CONSTRAINT_KEYS = [
  "format", "pattern", "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf",
  "minLength", "maxLength", "minItems", "maxItems", "uniqueItems", "minProperties", "maxProperties",
  "default", "const", "enum",
] as const;

interface Node {
  label: string;
  children: Node[];
}

export interface TreeOptions {
  /** Unicode box-drawing (├──) or plain ASCII (|--). */
  style?: "unicode" | "ascii";
  maxNodes?: number;
  maxDepth?: number;
}

function render(root: Node, style: "unicode" | "ascii"): string {
  const [tee, elbow, pipe, blank] = style === "unicode" ? ["├── ", "└── ", "│   ", "    "] : ["|-- ", "`-- ", "|   ", "    "];
  const lines: string[] = [root.label];
  const walk = (n: Node, prefix: string) => {
    n.children.forEach((c, i) => {
      const last = i === n.children.length - 1;
      lines.push(prefix + (last ? elbow : tee) + c.label);
      walk(c, prefix + (last ? blank : pipe));
    });
  };
  walk(root, "");
  return lines.join("\n");
}

function scalar(v: unknown): string {
  if (typeof v === "string") {
    const s = v.length > 80 ? v.slice(0, 77) + "…" : v;
    return JSON.stringify(s);
  }
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

class Budget {
  count = 0;
  constructor(readonly max: number) {}
  take() {
    this.count++;
    return this.count <= this.max;
  }
}

function dataTree(value: unknown, opts: Required<TreeOptions>): Node {
  const budget = new Budget(opts.maxNodes);
  const build = (key: string, v: unknown, depth: number): Node => {
    if (Array.isArray(v)) {
      const node: Node = { label: `${key} [array · ${v.length}]`, children: [] };
      if (depth >= opts.maxDepth) node.children.push({ label: "…", children: [] });
      else
        for (let i = 0; i < v.length; i++) {
          if (!budget.take()) {
            node.children.push({ label: `… ${v.length - i} more`, children: [] });
            break;
          }
          node.children.push(build(`[${i}]`, v[i], depth + 1));
        }
      return node;
    }
    if (isObj(v) && !(v instanceof Date)) {
      const keys = Object.keys(v);
      const node: Node = { label: `${key} {object · ${keys.length}}`, children: [] };
      if (depth >= opts.maxDepth) node.children.push({ label: "…", children: [] });
      else
        for (let i = 0; i < keys.length; i++) {
          if (!budget.take()) {
            node.children.push({ label: `… ${keys.length - i} more`, children: [] });
            break;
          }
          node.children.push(build(keys[i], v[keys[i]], depth + 1));
        }
      return node;
    }
    const t = v === null ? "null" : typeof v;
    return { label: `${key}: ${scalar(v)} (${t})`, children: [] };
  };
  return build("root", value, 0);
}

function schemaType(s: Record<string, unknown>): string {
  if (typeof s.$ref === "string") return `→ ${s.$ref}`;
  let t = Array.isArray(s.type) ? s.type.join(" | ") : typeof s.type === "string" ? s.type : "";
  if (!t) {
    if (isObj(s.properties)) t = "object";
    else if (s.items !== undefined) t = "array";
    else if (Array.isArray(s.enum)) t = "enum";
    else if (s.const !== undefined) t = "const";
    else if (s.oneOf) t = "oneOf";
    else if (s.anyOf) t = "anyOf";
    else if (s.allOf) t = "allOf";
    else t = "any";
  }
  if (t === "array" && isObj(s.items)) {
    const inner = schemaType(s.items);
    if (!isObj(s.items.properties)) return `array<${inner}>`;
  }
  return t;
}

function constraints(s: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const k of CONSTRAINT_KEYS) {
    if (s[k] === undefined) continue;
    const v = s[k];
    if (k === "enum" && Array.isArray(v)) parts.push(`enum: ${v.map(scalar).join(" | ")}`);
    else parts.push(`${k}: ${typeof v === "string" && k !== "format" ? JSON.stringify(v) : scalar(v)}`);
  }
  if (s.nullable === true) parts.push("nullable");
  if (s.deprecated === true) parts.push("deprecated");
  if (s.readOnly === true) parts.push("readOnly");
  if (s.writeOnly === true) parts.push("writeOnly");
  return parts.length ? ` [${parts.join(", ")}]` : "";
}

function schemaTree(schema: Record<string, unknown>, opts: Required<TreeOptions>): Node {
  const budget = new Budget(opts.maxNodes);
  const build = (name: string, s: unknown, required: boolean, depth: number): Node => {
    if (typeof s === "boolean") return { label: `${name}: ${s ? "any (true)" : "never (false)"}`, children: [] };
    if (!isObj(s)) return { label: `${name}: ?`, children: [] };
    const req = required ? " (required)" : "";
    const title = typeof s.title === "string" && depth === 0 ? ` "${s.title}"` : "";
    const node: Node = { label: `${name}${title}: ${schemaType(s)}${req}${constraints(s)}`, children: [] };
    if (depth >= opts.maxDepth) {
      node.children.push({ label: "…", children: [] });
      return node;
    }
    const add = (n: string, sub: unknown, r = false) => {
      if (!budget.take()) return false;
      node.children.push(build(n, sub, r, depth + 1));
      return true;
    };
    const req2 = new Set(Array.isArray(s.required) ? (s.required as string[]) : []);
    if (isObj(s.properties)) {
      for (const [k, sub] of Object.entries(s.properties)) if (!add(k, sub, req2.has(k))) break;
    }
    if (isObj(s.patternProperties)) {
      for (const [k, sub] of Object.entries(s.patternProperties)) if (!add(`/${k}/`, sub)) break;
    }
    if (isObj(s.additionalProperties)) add("additionalProperties", s.additionalProperties);
    else if (s.additionalProperties === false && isObj(s.properties))
      node.children.push({ label: "(no additional properties)", children: [] });
    if (Array.isArray(s.prefixItems)) s.prefixItems.forEach((sub, i) => add(`[${i}]`, sub));
    // Only expand items when they carry structure; array<string> is already in the label.
    if (isObj(s.items) && (isObj(s.items.properties) || s.items.oneOf || s.items.anyOf || s.items.allOf || s.items.items))
      add("items", s.items);
    for (const comb of ["oneOf", "anyOf", "allOf"] as const) {
      if (Array.isArray(s[comb])) (s[comb] as unknown[]).forEach((sub, i) => add(`${comb}[${i}]`, sub));
    }
    if (isObj(s.not)) add("not", s.not);
    for (const defsKey of ["$defs", "definitions"] as const) {
      if (depth === 0 && isObj(s[defsKey])) {
        const defsNode: Node = { label: defsKey, children: [] };
        for (const [k, sub] of Object.entries(s[defsKey] as Record<string, unknown>)) {
          if (!budget.take()) break;
          defsNode.children.push(build(k, sub, false, depth + 2));
        }
        node.children.push(defsNode);
      }
    }
    return node;
  };
  return build("root", schema, false, 0);
}

export interface TreeResult {
  tree: string;
  mode: TreeMode;
  reason: string;
  format: InputFormat;
}

export function buildTree(
  text: string,
  options: TreeOptions & { mode?: "auto" | TreeMode; format?: "auto" | InputFormat } = {},
): { ok: true; value: TreeResult } | { ok: false; message: string; line?: number; column?: number } {
  const opts: Required<TreeOptions> = {
    style: options.style ?? "unicode",
    maxNodes: options.maxNodes ?? 5000,
    maxDepth: options.maxDepth ?? 64,
  };
  const parsed = parseStructured(text, options.format ?? "auto");
  if (!parsed.ok) return parsed;
  const detection = detectSchema(parsed.value);
  const requested = options.mode ?? "auto";
  const mode: TreeMode = requested === "auto" ? (detection.isSchema ? "schema" : "data") : requested;
  if (mode === "schema" && !isObj(parsed.value))
    return { ok: false, message: "Schema mode needs an object at the top level." };
  const root = mode === "schema" ? schemaTree(parsed.value as Record<string, unknown>, opts) : dataTree(parsed.value, opts);
  return {
    ok: true,
    value: {
      tree: render(root, opts.style),
      mode,
      reason: requested === "auto" ? detection.reason : `Mode set manually to ${mode}.`,
      format: parsed.format,
    },
  };
}
