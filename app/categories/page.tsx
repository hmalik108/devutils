import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { activeCategories, toolsInCategory } from "@/lib/tools-registry";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

export const metadata = pageMetadata({
  title: "Tool Categories",
  description: "Developer utilities grouped by category: JSON tools, encoding, code tools, security, date & time and DevOps. All free and browser-based.",
  path: "/categories",
});

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Categories", path: "/categories" }]} />
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Tool categories</h1>
      <ul className="mt-8 grid gap-6 md:grid-cols-2">
        {activeCategories().map((c) => {
          const Icon = c.icon;
          return (
            <li key={c.slug} className="rounded-xl border bg-card p-6 shadow-xs">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Icon aria-hidden className="size-5 text-primary" />
                <Link href={`/${c.slug}`} className="hover:text-primary">
                  {c.name}
                </Link>
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
              <ul className="mt-4 space-y-1.5 text-sm">
                {toolsInCategory(c.slug).map((t) => (
                  <li key={t.slug}>
                    <Link href={`/${t.slug}`} className="text-primary hover:underline">
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
