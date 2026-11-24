import type { ToolContent } from "../types";
import { content as jsonFormatter } from "./json-formatter";
import { content as base64 } from "./base64-encoder-decoder";
import { content as uuid } from "./uuid-generator";
import { content as jwt } from "./jwt-decoder";
import { content as url } from "./url-encoder-decoder";
import { content as regex } from "./regex-tester";
import { content as timestamp } from "./unix-timestamp-converter";
import { content as jsonDiff } from "./json-diff";
import { content as cron } from "./cron-generator";
import { content as html } from "./html-formatter";
import { content as yaml } from "./yaml-formatter";
import { content as tree } from "./json-yaml-tree";
import { content as hash } from "./hash-generator";

/** Server-only content map, keyed by tool slug (see lib/tools-registry.ts). */
export const toolContent: Record<string, ToolContent> = {
  "json-formatter": jsonFormatter,
  "base64-encoder-decoder": base64,
  "uuid-generator": uuid,
  "jwt-decoder": jwt,
  "url-encoder-decoder": url,
  "regex-tester": regex,
  "unix-timestamp-converter": timestamp,
  "json-diff": jsonDiff,
  "cron-generator": cron,
  "html-formatter": html,
  "yaml-formatter": yaml,
  "json-yaml-tree": tree,
  "hash-generator": hash,
};
