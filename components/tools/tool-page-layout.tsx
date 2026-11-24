import Link from "next/link";
import { BookOpen, Lock } from "lucide-react";
import type { Tool } from "@/lib/tools-registry";
import { relatedTools } from "@/lib/tools-registry";
import { softwareApplicationJsonLd, toolBreadcrumbs } from "@/lib/seo";
import type { ToolContent } from "@/content/types";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { RichText } from "./rich-text";
import { ToolViewTracker } from "./tool-view-tracker";
import { TrackedLink } from "./tracked-link";

const DEFAULT_PRIVACY =
  "All processing happens locally in your browser. Your input is not uploaded, logged, or saved to browser storage, and it is never included in analytics.";

/**
 * Shared layout for every tool page: breadcrumb, H1, one-line description,
 * the interactive tool (as much room as possible), a privacy note, a link to
 * the tool's guide, and related tools. Long-form help lives on /guides/<slug>.
 */
export function ToolPageLayout({ tool, content, children }: { tool: Tool; content: ToolContent; children: React.ReactNode }) {
  const related = relatedTools(tool.slug);
  return (
    <article className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <ToolViewTracker slug={tool.slug} />
      <JsonLd data={softwareApplicationJsonLd(tool)} />
      <Breadcrumbs items={toolBreadcrumbs(tool)} />

      <header className="mt-4 mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{tool.name}</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">{tool.description}</p>
        </div>
        <Link
          href={`/guides/${tool.slug}`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <BookOpen aria-hidden className="size-4" /> Guide, examples &amp; FAQ
        </Link>
      </header>

      <section aria-label={`${tool.name} tool`} data-tool-root className="rounded-xl border bg-card p-4 shadow-xs sm:p-6">
        {children}
      </section>

      <section aria-labelledby="privacy-heading" className="mt-6 flex gap-3 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
        <Lock aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
        <div>
          <h2 id="privacy-heading" className="font-semibold">
            Privacy
          </h2>
          <p className="mt-0.5 text-muted-foreground">
            <RichText text={content.privacy ?? DEFAULT_PRIVACY} />
          </p>
        </div>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-12">
          <h2 id="related-heading" className="text-lg font-semibold">
            Related tools
          </h2>
          <ul className={`mt-4 grid gap-3 sm:grid-cols-2 ${related.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
            {related.map((t) => {
              const Icon = t.icon;
              return (
                <li key={t.slug}>
                  <TrackedLink
                    href={`/${t.slug}`}
                    event="related_tool_click"
                    tool={t.slug}
                    className="flex h-full items-start gap-3 rounded-lg border bg-card p-4 shadow-xs transition-colors hover:border-primary/40 hover:bg-accent/40"
                  >
                    <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span>
                      <span className="block text-sm font-medium">{t.name}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{t.description}</span>
                    </span>
                  </TrackedLink>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </article>
  );
}
