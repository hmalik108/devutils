/**
 * Supporting content for a tool page. Strings support a tiny inline syntax:
 * `code`, **bold** and [link text](/path).
 */
export interface ToolContent {
  /** Introductory paragraphs: what the tool does and why you'd use it. */
  intro: string[];
  /** Ordered usage instructions. */
  howTo: string[];
  examples: { title: string; description?: string; input?: string; output?: string }[];
  /** Additional explanatory sections (concepts, dialect notes, caveats). */
  sections?: { heading: string; paragraphs?: string[]; bullets?: string[]; code?: string }[];
  faqs: { q: string; a: string }[];
  /** Tool-specific privacy note (a generic one is always shown too). */
  privacy?: string;
}
