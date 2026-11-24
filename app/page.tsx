import Link from "next/link";
import { ArrowRight, Lock, Zap, UserX } from "lucide-react";
import { activeCategories, featuredTools, recentlyAdded, toolsInCategory, liveTools } from "@/lib/tools-registry";
import { pageMetadata, websiteJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { ToolCard } from "@/components/tools/tool-card";
import { ToolSearch } from "@/components/tools/tool-search";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata = pageMetadata({
  title: `${siteConfig.name} — Free Online Developer Utilities`,
  description: siteConfig.description,
  path: "/",
  absoluteTitle: true,
});

export default function HomePage() {
  const featured = featuredTools();
  const recent = recentlyAdded(6);
  const count = liveTools().length;
  return (
    <>
      <JsonLd data={websiteJsonLd()} />
      <section className="border-b bg-gradient-to-b from-accent/50 to-background">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
          <p className="text-sm font-medium text-primary">{siteConfig.tagline}</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Free developer tools that run in your browser</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Format JSON, decode JWTs, test regex, convert timestamps and more. No sign-up, no installs — and your data never leaves your device.
          </p>
          <div className="mx-auto mt-8 max-w-xl text-left">
            <ToolSearch size="lg" placeholder={`Search ${count} tools…`} />
          </div>
          <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <Lock aria-hidden className="size-4" /> Processed locally
            </li>
            <li className="flex items-center gap-1.5">
              <UserX aria-hidden className="size-4" /> No account needed
            </li>
            <li className="flex items-center gap-1.5">
              <Zap aria-hidden className="size-4" /> Instant results
            </li>
          </ul>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        <section aria-labelledby="featured" className="mt-14">
          <div className="flex items-end justify-between">
            <h2 id="featured" className="text-2xl font-semibold tracking-tight">
              Featured tools
            </h2>
            <Link href="/tools" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              All tools <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((t) => (
              <li key={t.slug}>
                <ToolCard tool={t} />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="categories" className="mt-16">
          <h2 id="categories" className="text-2xl font-semibold tracking-tight">
            Browse by category
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeCategories().map((c) => {
              const Icon = c.icon;
              const items = toolsInCategory(c.slug);
              return (
                <li key={c.slug}>
                  <Link href={`/${c.slug}`} className="flex h-full flex-col rounded-xl border bg-card p-5 shadow-xs transition-colors hover:border-primary/40">
                    <span className="flex items-center gap-3">
                      <Icon aria-hidden className="size-5 text-primary" />
                      <span className="font-semibold">{c.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{items.length} tools</span>
                    </span>
                    <span className="mt-2 text-sm text-muted-foreground">{c.description}</span>
                    <span className="mt-3 text-xs text-muted-foreground">{items.map((t) => t.name).join(" · ")}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="recent" className="mt-16">
          <h2 id="recent" className="text-2xl font-semibold tracking-tight">
            Recently added
          </h2>
          <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((t) => (
              <li key={t.slug}>
                <Link href={`/${t.slug}`} className="group flex items-center gap-2 text-sm">
                  <t.icon aria-hidden className="size-4 text-muted-foreground" />
                  <span className="font-medium group-hover:text-primary">{t.name}</span>
                  <time dateTime={t.addedAt} className="ml-auto text-xs text-muted-foreground">
                    {new Date(t.addedAt + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="privacy" className="mt-16 rounded-xl border bg-muted/40 p-6 sm:p-8">
          <h2 id="privacy" className="flex items-center gap-2 text-xl font-semibold">
            <Lock aria-hidden className="size-5 text-primary" /> Private by design
          </h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Every tool on {siteConfig.name} runs entirely in your browser using standard web APIs. What you paste — tokens, configs, logs — is never uploaded, logged or stored. We don&apos;t require accounts and we never include your inputs in analytics.{" "}
            <Link href="/privacy-policy" className="text-primary underline underline-offset-4">
              Read our privacy policy
            </Link>
            .
          </p>
        </section>
      </div>
    </>
  );
}
