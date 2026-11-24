"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

export function ToolViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    track("tool_view", { tool: slug });
  }, [slug]);
  return null;
}
