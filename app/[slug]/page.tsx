import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTool, getCategory, liveTools, activeCategories, toolsInCategory, categories } from "@/lib/tools-registry";
import { toolMetadata, categoryMetadata } from "@/lib/seo";
import { toolContent } from "@/content/tools";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { ToolInterface } from "@/components/tools/tool-interface";
import { ToolCard } from "@/components/tools/tool-card";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

/**
 * One top-level dynamic segment serves both tool pages (/json-formatter) and
 * category pages (/json-tools), as specified in the PRD's URL structure.
 * Everything is statically generated from the registry; unknown slugs 404.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [...liveTools().map((t) => ({ slug: t.slug })), ...activeCategories().map((c) => ({ slug: c.slug }))];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (tool) return toolMetadata(tool);
  const cat = getCategory(slug);
  if (cat) return categoryMetadata(cat);
  return {};
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;

  const tool = getTool(slug);
  if (tool) {
    const content = toolContent[tool.slug];
    if (!content) notFound();
    return (
      <ToolPageLayout tool={tool} content={content}>
        <ToolInterface slug={tool.slug} />
      </ToolPageLayout>
    );
  }

  const cat = getCategory(slug);
  if (cat && toolsInCategory(cat.slug).length > 0) {
    const Icon = cat.icon;
    const others = categories.filter((c) => c.slug !== cat.slug && toolsInCategory(c.slug).length > 0);
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Categories", path: "/categories" }, { name: cat.name, path: `/${cat.slug}` }]} />
        <header className="mt-4">
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            <Icon aria-hidden className="size-7 text-primary" /> {cat.name}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{cat.description} Every tool runs locally in your browser.</p>
        </header>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {toolsInCategory(cat.slug).map((t) => (
            <li key={t.slug}>
              <ToolCard tool={t} showCategory={false} />
            </li>
          ))}
        </ul>
        <nav aria-labelledby="other-cats" className="mt-14">
          <h2 id="other-cats" className="text-lg font-semibold">
            Other categories
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {others.map((c) => (
              <li key={c.slug}>
                <Link href={`/${c.slug}`} className="inline-block rounded-full border px-3 py-1.5 text-sm hover:bg-accent">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    );
  }

  notFound();
}
