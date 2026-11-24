"use client";

import { useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { searchTools, getCategory } from "@/lib/tools-registry";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface ToolSearchProps {
  autoFocus?: boolean;
  onNavigate?: () => void;
  placeholder?: string;
  size?: "default" | "lg";
  limit?: number;
}

/** Combobox-style search over the tool registry. The query itself is never sent anywhere. */
export function ToolSearch({ autoFocus, onNavigate, placeholder = "Search tools — e.g. json, jwt, base64…", size = "default", limit = 8 }: ToolSearchProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const tracked = useRef(false);
  const router = useRouter();
  const id = useId();
  const results = useMemo(() => (query.trim() ? searchTools(query).slice(0, limit) : []), [query, limit]);
  const open = query.trim().length > 0;

  const go = (slug: string) => {
    onNavigate?.();
    router.push(`/${slug}`);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search aria-hidden className={cn("pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground", size === "lg" ? "size-5" : "size-4")} />
        <input
          type="search"
          role="combobox"
          aria-label="Search tools"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open && results[active] ? `${id}-${results[active].slug}` : undefined}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            if (!tracked.current && e.target.value) {
              tracked.current = true;
              track("tool_search");
            }
          }}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && results[active]) {
              e.preventDefault();
              go(results[active].slug);
            } else if (e.key === "Escape") {
              setQuery("");
            }
          }}
          className={cn(
            "w-full rounded-lg border border-input bg-background pr-3 shadow-xs placeholder:text-muted-foreground",
            size === "lg" ? "h-12 pl-11 text-base" : "h-10 pl-9 text-sm",
          )}
        />
      </div>
      {open && (
        <ul id={`${id}-list`} role="listbox" aria-label="Matching tools" className="absolute z-50 mt-2 max-h-96 w-full overflow-auto rounded-lg border bg-card p-1 shadow-lg">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground" role="option" aria-selected={false} aria-disabled>
              No tools match “{query}”.{" "}
              <Link href="/tools" className="text-primary underline" onClick={onNavigate}>
                Browse all tools
              </Link>
            </li>
          ) : (
            results.map((t, i) => {
              const Icon = t.icon;
              return (
                <li
                  key={t.slug}
                  id={`${id}-${t.slug}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    go(t.slug);
                  }}
                  className={cn("flex cursor-pointer items-start gap-3 rounded-md px-3 py-2", i === active && "bg-accent text-accent-foreground")}
                >
                  <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{t.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {getCategory(t.category)?.name} · {t.description}
                    </span>
                  </span>
                </li>
              );
            })
          )}
        </ul>
      )}
      <p className="sr-only" aria-live="polite">
        {open ? `${results.length} tool${results.length === 1 ? "" : "s"} found` : ""}
      </p>
    </div>
  );
}
