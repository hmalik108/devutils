"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, type ComponentType } from "react";

const Loading = () => <div aria-hidden className="h-96 animate-pulse rounded-lg bg-muted/50" />;

/**
 * Marks the enclosing tool region with data-ready="true" once the tool UI has
 * hydrated and is interactive (used by e2e tests; harmless for users).
 */
function withReady(C: ComponentType): ComponentType {
  function Ready() {
    const ref = useRef<HTMLSpanElement>(null);
    useEffect(() => {
      ref.current?.closest("[data-tool-root]")?.setAttribute("data-ready", "true");
    }, []);
    return (
      <>
        <C />
        <span ref={ref} hidden />
      </>
    );
  }
  return Ready;
}

const load = (importer: () => Promise<{ default: ComponentType }>) =>
  dynamic(() => importer().then((m) => ({ default: withReady(m.default) })), { loading: Loading });

/**
 * Maps a tool slug to its interactive UI. Each UI is its own chunk, so a page
 * only ships the JavaScript for the tool it shows. UIs are still server-rendered
 * (their initial state is static), which keeps LCP and CLS low.
 */
const UIS: Record<string, ComponentType> = {
  "json-formatter": load(() => import("@/components/tool-ui/json-formatter")),
  "base64-encoder-decoder": load(() => import("@/components/tool-ui/base64")),
  "uuid-generator": load(() => import("@/components/tool-ui/uuid-generator")),
  "jwt-decoder": load(() => import("@/components/tool-ui/jwt-decoder")),
  "url-encoder-decoder": load(() => import("@/components/tool-ui/url-encoder")),
  "regex-tester": load(() => import("@/components/tool-ui/regex-tester")),
  "unix-timestamp-converter": load(() => import("@/components/tool-ui/timestamp-converter")),
  "json-diff": load(() => import("@/components/tool-ui/json-diff")),
  "cron-generator": load(() => import("@/components/tool-ui/cron-generator")),
  "html-formatter": load(() => import("@/components/tool-ui/html-formatter")),
  "yaml-formatter": load(() => import("@/components/tool-ui/yaml-formatter")),
  "json-yaml-tree": load(() => import("@/components/tool-ui/json-yaml-tree")),
  "hash-generator": load(() => import("@/components/tool-ui/hash-generator")),
};

export function hasToolInterface(slug: string): boolean {
  return slug in UIS;
}

export function ToolInterface({ slug }: { slug: string }) {
  const UI = UIS[slug];
  return UI ? <UI /> : null;
}
