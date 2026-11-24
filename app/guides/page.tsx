import Link from "next/link";
import { BookOpen } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { activeCategories, toolsInCategory } from "@/lib/tools-registry";
import { toolContent } from "@/content/tools";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

export const metadata = pageMetadata({
  title: "Guides — How to Use Every Developer Tool",
  description: "Guides for every devutils.info tool: how to use them, worked examples, background on formats like JSON, Base64, JWT and cron, and answers to common questions.",
  path: "/guides",
});

export default function GuidesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Guides", path: "/guides" }]} />
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Guides</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Instructions, examples and FAQs for every tool, plus background on the formats they work with.</p>
      {activeCategories().map((c) => {
        const items = toolsInCategory(c.slug).filter((t) => toolContent[t.slug]);
        if (!items.length) return null;
        return (
          <section key={c.slug} aria-labelledby={`g-${c.slug}`} className="mt-10">
            <h2 id={`g-${c.slug}`} className="text-lg font-semibold">
              {c.name}
            </h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((t) => (
                <li key={t.slug}>
                  <Link href={`/guides/${t.slug}`} className="flex h-full items-start gap-3 rounded-lg border bg-card p-4 shadow-xs transition-colors hover:border-primary/40 hover:bg-accent/40">
                    <BookOpen aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span>
                      <span className="block text-sm font-medium">{t.name} guide</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{toolContent[t.slug].intro[0].replace(/[`*]/g, "").slice(0, 140)}…</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
