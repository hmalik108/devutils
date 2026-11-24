/**
 * Privacy-conscious analytics.
 *
 * - Disabled unless NEXT_PUBLIC_ANALYTICS_DOMAIN is set.
 * - Events carry ONLY the event name and a tool slug / coarse label from an allowlist.
 *   Tool inputs and outputs are never passed to this module — the type system enforces it.
 */
export type AnalyticsEvent =
  | "tool_view"
  | "tool_execute"
  | "tool_success"
  | "tool_error"
  | "copy_output"
  | "download_output"
  | "tool_search"
  | "related_tool_click";

export interface AnalyticsProps {
  tool?: string;
  /** Coarse, non-user-derived label, e.g. "minify" or "invalid_json". */
  action?: string;
}

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, string> }) => void;
  }
}

export const analyticsEnabled = Boolean(process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN);

export function track(event: AnalyticsEvent, props: AnalyticsProps = {}) {
  if (!analyticsEnabled || typeof window === "undefined") return;
  const clean: Record<string, string> = {};
  if (props.tool) clean.tool = props.tool.slice(0, 64);
  if (props.action) clean.action = props.action.slice(0, 64);
  try {
    window.plausible?.(event, { props: clean });
  } catch {
    // Analytics must never break a tool.
  }
}
