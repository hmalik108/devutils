import { getTool, getCategory, liveTools, activeCategories } from "@/lib/tools-registry";
import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE, defaultOgAlt } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = defaultOgAlt;

export function generateStaticParams() {
  return [...liveTools().map((t) => ({ slug: t.slug })), ...activeCategories().map((c) => ({ slug: c.slug }))];
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (tool) return renderOgImage({ eyebrow: getCategory(tool.category)?.name, title: tool.name, description: tool.description });
  const cat = getCategory(slug);
  return renderOgImage({ eyebrow: "Category", title: cat?.name ?? "Developer tools", description: cat?.description ?? "" });
}
