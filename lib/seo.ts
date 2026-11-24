import type { Metadata } from "next";
import { siteConfig, absoluteUrl } from "./site";
import { getCategory, type Category, type Tool } from "./tools-registry";

interface PageMetaInput {
  title: string;
  description: string;
  path: string;
  /** Set false for pages that must not be indexed. */
  index?: boolean;
  /** Use the title as-is instead of appending the site name. */
  absoluteTitle?: boolean;
  /**
   * Open Graph image path. Defaults to the site-wide image (app/opengraph-image.tsx).
   * Tool and category pages use their own (app/[slug]/opengraph-image.tsx).
   */
  image?: string;
}

export function pageMetadata({ title, description, path, index = true, absoluteTitle, image = "/opengraph-image" }: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = absoluteTitle ? title : `${title} | ${siteConfig.name}`;
  const images = [{ url: image, width: 1200, height: 630, alt: fullTitle }];
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: url },
    robots: index ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: "website",
      url,
      title: fullTitle,
      description,
      siteName: siteConfig.name,
      locale: "en_US",
      images,
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images },
  };
}

export function toolMetadata(tool: Tool): Metadata {
  return pageMetadata({ title: tool.seoTitle, description: tool.seoDescription, path: `/${tool.slug}`, image: `/${tool.slug}/opengraph-image` });
}

export function guideMetadata(tool: Tool): Metadata {
  return pageMetadata({
    title: `${tool.name} Guide — How to Use, Examples & FAQ`,
    description: `How to use the ${tool.name} on devutils.info: step-by-step instructions, worked examples, background and answers to common questions.`,
    path: `/guides/${tool.slug}`,
    image: `/${tool.slug}/opengraph-image`,
  });
}

export function categoryMetadata(category: Category): Metadata {
  return pageMetadata({
    title: `${category.name} — Free Online ${category.name}`,
    description: `${category.description} Free, private and processed in your browser.`,
    path: `/${category.slug}`,
    image: `/${category.slug}/opengraph-image`,
  });
}

// ---------------------------------------------------------------------------
// Structured data (Schema.org). Must reflect visible content only — no ratings,
// reviews or usage statistics.
// ---------------------------------------------------------------------------

export type Crumb = { name: string; path: string };

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteConfig.url}/tools?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function softwareApplicationJsonLd(tool: Tool) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.seoDescription,
    url: absoluteUrl(`/${tool.slug}`),
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: getCategory(tool.category)?.name,
    operatingSystem: "Any (web browser)",
    isAccessibleForFree: true,
    // The tool is genuinely free; this is the only "pricing" stated, and it is visible on the page.
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}

export function guideBreadcrumbs(tool: Tool): Crumb[] {
  return [
    { name: "Home", path: "/" },
    { name: "Guides", path: "/guides" },
    { name: tool.name, path: `/guides/${tool.slug}` },
  ];
}

export function toolBreadcrumbs(tool: Tool): Crumb[] {
  const cat = getCategory(tool.category)!;
  return [
    { name: "Home", path: "/" },
    { name: cat.name, path: `/${cat.slug}` },
    { name: tool.name, path: `/${tool.slug}` },
  ];
}
