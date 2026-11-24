import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Tool } from "@/lib/tools-registry";
import { getCategory } from "@/lib/tools-registry";

export function ToolCard({ tool, showCategory = true }: { tool: Tool; showCategory?: boolean }) {
  const Icon = tool.icon;
  return (
    <Link
      href={`/${tool.slug}`}
      className="group flex h-full flex-col rounded-xl border bg-card p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Icon aria-hidden className="size-4.5" />
        </span>
        <h3 className="font-semibold leading-tight">{tool.name}</h3>
      </div>
      <p className="mt-3 flex-1 text-sm text-muted-foreground">{tool.description}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        {showCategory ? <span>{getCategory(tool.category)?.name}</span> : <span />}
        <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    </Link>
  );
}
