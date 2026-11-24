import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getTool, liveTools, getCategory } from "@/lib/tools-registry";
import { guideMetadata, guideBreadcrumbs } from "@/lib/seo";
import { toolContent } from "@/content/tools";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { ToolGuide } from "@/components/tools/tool-guide";
import { Button } from "@/components/ui/button";

export const dynamicParams = false;

export function generateStaticParams() {
  return liveTools()
    .filter((t) => toolContent[t.slug])
    .map((t) => ({ slug: t.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  return tool ? guideMetadata(tool) : {};
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const tool = getTool(slug);
  const content = tool && toolContent[tool.slug];
  if (!tool || !content) notFound();
  const Icon = tool.icon;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={guideBreadcrumbs(tool)} />
      <header className="mt-4 border-b pb-6">
        <p className="text-sm text-muted-foreground">{getCategory(tool.category)?.name} · Guide</p>
        <h1 className="mt-1 flex items-center gap-3 text-3xl font-bold tracking-tight">
          <Icon aria-hidden className="size-7 text-primary" /> {tool.name} guide
        </h1>
        <p className="mt-2 text-muted-foreground">{tool.description}</p>
        <Button asChild className="mt-4">
          <Link href={`/${tool.slug}`}>
            Open the {tool.name} <ArrowRight />
          </Link>
        </Button>
      </header>
      <ToolGuide tool={tool} content={content} />
      <div className="mt-12 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-4">
        <p className="text-sm text-muted-foreground">Ready to try it? Everything runs locally in your browser.</p>
        <Button asChild variant="secondary">
          <Link href={`/${tool.slug}`}>
            Open the tool <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
