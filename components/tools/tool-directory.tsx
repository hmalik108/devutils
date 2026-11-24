"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { categories, liveTools, searchTools, toolsInCategory, type CategorySlug } from "@/lib/tools-registry";
import { ToolCard } from "./tool-card";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

/** Searchable, filterable directory of all live tools. State is mirrored in the URL (?q=&category=). */
export function ToolDirectory() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const initialCat = params.get("category");
  const [cat, setCat] = useState<CategorySlug | "all">(categories.some((c) => c.slug === initialCat) ? (initialCat as CategorySlug) : "all");

  const sync = (q: string, c: string) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (c !== "all") sp.set("category", c);
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  const results = useMemo(() => {
    const pool = cat === "all" ? liveTools() : toolsInCategory(cat);
    return searchTools(query, pool);
  }, [query, cat]);

  const visibleCats = categories.filter((c) => toolsInCategory(c.slug).length > 0);
  const grouped = !query.trim();

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div className="relative max-w-xl">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            aria-label="Filter tools by name, description or keyword"
            placeholder="Filter by name, description or keyword…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              sync(e.target.value, cat);
            }}
            onBlur={() => query && track("tool_search")}
            className="h-10 w-full rounded-lg border border-input bg-background pr-3 pl-9 text-sm shadow-xs"
          />
        </div>
        <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
          {[{ slug: "all" as const, name: "All" }, ...visibleCats].map((c) => (
            <button
              key={c.slug}
              type="button"
              aria-pressed={cat === c.slug}
              onClick={() => {
                setCat(c.slug);
                sync(query, c.slug);
              }}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors",
                cat === c.slug ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <p role="status" className="mt-6 text-sm text-muted-foreground">
        {results.length} tool{results.length === 1 ? "" : "s"}
      </p>

      {results.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed p-10 text-center text-muted-foreground">No tools match your search.</p>
      ) : grouped ? (
        visibleCats
          .filter((c) => cat === "all" || c.slug === cat)
          .map((c) => {
            const items = results.filter((t) => t.category === c.slug);
            if (!items.length) return null;
            return (
              <section key={c.slug} aria-labelledby={`cat-${c.slug}`} className="mt-8">
                <h2 id={`cat-${c.slug}`} className="text-lg font-semibold">
                  {c.name}
                </h2>
                <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((t) => (
                    <li key={t.slug}>
                      <ToolCard tool={t} showCategory={false} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((t) => (
            <li key={t.slug}>
              <ToolCard tool={t} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
