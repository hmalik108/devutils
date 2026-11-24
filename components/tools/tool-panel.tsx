"use client";

import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ToolPanelProps {
  title: string;
  htmlFor?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /**
   * Adds a "Full screen" button that expands the panel to fill the viewport.
   * Elements marked `data-fs-fill` (code editors are marked automatically)
   * grow to use the extra space. Escape or the button returns to normal.
   */
  expandable?: boolean;
}

/** Labelled area used for tool inputs/outputs; actions render on the right. */
export function ToolPanel({ title, htmlFor, actions, children, className, expandable }: ToolPanelProps) {
  const [full, setFull] = useState(false);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFull(false);
    };
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [full]);

  return (
    <section
      data-fullscreen={full || undefined}
      className={cn("flex min-w-0 flex-col gap-2", full && "fixed inset-0 z-50 bg-background p-4 sm:p-6", className)}
    >
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="text-sm font-semibold">
            {title}
          </label>
        ) : (
          <h2 className="text-sm font-semibold">{title}</h2>
        )}
        {(actions || expandable) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {actions}
            {expandable && (
              <Button variant="ghost" size="sm" onClick={() => setFull((f) => !f)} title={full ? "Exit full screen (Esc)" : "Full screen"}>
                {full ? <Minimize2 /> : <Maximize2 />} {full ? "Exit full screen" : "Full screen"}
              </Button>
            )}
          </div>
        )}
      </div>
      {/* `contents` keeps the children mounted in the same place when toggling. */}
      <div className={full ? "flex min-h-0 flex-1 flex-col gap-2" : "contents"}>{children}</div>
    </section>
  );
}

export function Toolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-2", className)}>{children}</div>;
}
