import { Lock } from "lucide-react";
import type { Tool } from "@/lib/tools-registry";
import { relatedTools } from "@/lib/tools-registry";
import { softwareApplicationJsonLd, toolBreadcrumbs } from "@/lib/seo";
import type { ToolContent } from "@/content/types";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { RichText } from "./rich-text";
import { ToolViewTracker } from "./tool-view-tracker";
import { TrackedLink } from "./tracked-link";

/**
 * Shared layout for every tool page (PRD §6.3): breadcrumb, H1, description,
 * the interactive tool near the top, then instructions, examples, FAQ,
 * related tools and privacy information.
 */
export function ToolPageLayout({ tool, content, children }: { tool: Tool; content: ToolContent; children: React.ReactNode }) {
  const related = relatedTools(tool.slug);
  return (
    <article className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <ToolViewTracker slug={tool.slug} />
      <JsonLd data={softwareApplicationJsonLd(tool)} />
      <Breadcrumbs items={toolBreadcrumbs(tool)} />

      <header className="mt-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{tool.name}</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">{tool.description}</p>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
          <Lock aria-hidden className="size-3" /> Runs in your browser — your input is never uploaded
        </p>
      </header>

      <section aria-label={`${tool.name} tool`} data-tool-root className="rounded-xl border bg-card p-4 shadow-xs sm:p-6">
        {children}
      </section>

      <div className="mt-4 grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="prose-tool min-w-0">
          <h2>About the {tool.name}</h2>
          {content.intro.map((p, i) => (
            <p key={i}>
              <RichText text={p} />
            </p>
          ))}

          <h2>How to use</h2>
          <ol>
            {content.howTo.map((s, i) => (
              <li key={i}>
                <RichText text={s} />
              </li>
            ))}
          </ol>

          <h2>Examples</h2>
          {content.examples.map((ex, i) => (
            <div key={i}>
              <h3>{ex.title}</h3>
              {ex.description && (
                <p>
                  <RichText text={ex.description} />
                </p>
              )}
              {ex.input !== undefined && (
                <>
                  <p className="!mb-1 text-xs font-medium tracking-wide uppercase">Input</p>
                  <pre>
                    <code>{ex.input === "" ? "(empty string)" : ex.input}</code>
                  </pre>
                </>
              )}
              {ex.output !== undefined && (
                <>
                  <p className="!mb-1 text-xs font-medium tracking-wide uppercase">Output</p>
                  <pre>
                    <code>{ex.output}</code>
                  </pre>
                </>
              )}
            </div>
          ))}

          {content.sections?.map((s) => (
            <section key={s.heading}>
              <h2>{s.heading}</h2>
              {s.paragraphs?.map((p, i) => (
                <p key={i}>
                  <RichText text={p} />
                </p>
              ))}
              {s.code && (
                <pre>
                  <code>{s.code}</code>
                </pre>
              )}
              {s.bullets && (
                <ul>
                  {s.bullets.map((b, i) => (
                    <li key={i}>
                      <RichText text={b} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <h2>Frequently asked questions</h2>
          <div className="not-prose divide-y rounded-lg border">
            {content.faqs.map((f, i) => (
              <details key={i} className="group px-4 py-3 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  <h3 className="!m-0 text-base">{f.q}</h3>
                  <span aria-hidden className="text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="!mb-0">
                  <RichText text={f.a} />
                </p>
              </details>
            ))}
          </div>

          <h2>Privacy</h2>
          <p>
            <RichText text={content.privacy ?? "All processing happens locally in your browser. Your input is not uploaded, logged, or saved to browser storage, and it is never included in analytics."} />
          </p>
        </div>

        <aside aria-labelledby="related-heading" className="lg:sticky lg:top-20 lg:self-start">
          <h2 id="related-heading" className="text-sm font-semibold">
            Related tools
          </h2>
          <ul className="mt-3 space-y-2">
            {related.map((t) => {
              const Icon = t.icon;
              return (
                <li key={t.slug}>
                  <TrackedLink href={`/${t.slug}`} event="related_tool_click" tool={t.slug} className="flex items-start gap-3 rounded-lg border bg-card p-3 hover:border-primary/40 hover:bg-accent/40">
                    <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span>
                      <span className="block text-sm font-medium">{t.name}</span>
                      <span className="block text-xs text-muted-foreground">{t.description}</span>
                    </span>
                  </TrackedLink>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </article>
  );
}
