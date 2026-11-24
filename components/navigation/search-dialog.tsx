"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { ToolSearch } from "@/components/tools/tool-search";
import { Button } from "@/components/ui/button";

/** Global tool search, opened with the header button, Ctrl/⌘+K or "/". */
export function SearchDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <>
      <Button variant="outline" size="sm" className="h-9 gap-2 text-muted-foreground md:w-56 md:justify-start" onClick={() => setOpen(true)} aria-label="Search tools" aria-keyshortcuts="Control+K Meta+K /">
        <Search />
        <span className="hidden md:inline">Search tools…</span>
        <kbd className="ml-auto hidden rounded border bg-muted px-1.5 font-mono text-[10px] md:inline">⌘K</kbd>
      </Button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === ref.current) setOpen(false);
        }}
        aria-label="Search tools"
        className="m-auto mt-[12vh] w-[min(36rem,calc(100vw-2rem))] overflow-visible rounded-xl border bg-card p-4 text-foreground shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      >
        {open && (
          <div className="flex items-start gap-2">
            <ToolSearch autoFocus onNavigate={() => setOpen(false)} />
            <Button variant="ghost" size="icon" aria-label="Close search" onClick={() => setOpen(false)}>
              <X />
            </Button>
          </div>
        )}
      </dialog>
    </>
  );
}
