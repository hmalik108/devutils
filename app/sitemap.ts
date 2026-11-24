import type { MetadataRoute } from "next";
import { liveTools, activeCategories } from "@/lib/tools-registry";
import { absoluteUrl } from "@/lib/site";

/** Generated from the registry: only live tools and non-empty categories are listed. */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { path: "/", priority: 1 },
    { path: "/tools", priority: 0.9 },
    { path: "/categories", priority: 0.6 },
    { path: "/about", priority: 0.3 },
    { path: "/contact", priority: 0.2 },
    { path: "/privacy-policy", priority: 0.2 },
    { path: "/terms", priority: 0.2 },
  ];
  return [
    ...staticPages.map((p) => ({ url: absoluteUrl(p.path), changeFrequency: "monthly" as const, priority: p.priority })),
    ...activeCategories().map((c) => ({ url: absoluteUrl(`/${c.slug}`), changeFrequency: "monthly" as const, priority: 0.7 })),
    ...liveTools().map((t) => ({ url: absoluteUrl(`/${t.slug}`), lastModified: new Date(t.addedAt), changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
