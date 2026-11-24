import { Suspense } from "react";
import { pageMetadata } from "@/lib/seo";
import { liveTools } from "@/lib/tools-registry";
import { ToolDirectory } from "@/components/tools/tool-directory";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { ToolCard } from "@/components/tools/tool-card";

export const metadata = pageMetadata({
  title: "All Developer Tools",
  description: "Browse every free developer utility on devutils.info: JSON, encoding, regex, JWT, hashing, timestamps, cron and YAML tools. Filter by category or keyword.",
  path: "/tools",
});

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Tools", path: "/tools" }]} />
      <h1 className="mt-4 text-3xl font-bold tracking-tight">All developer tools</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Every tool is free, needs no account and processes your input locally in the browser.</p>
      <div className="mt-8">
        {/* Fallback is a crawlable static list; the interactive directory hydrates over it. */}
        <Suspense
          fallback={
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {liveTools().map((t) => (
                <li key={t.slug}>
                  <ToolCard tool={t} />
                </li>
              ))}
            </ul>
          }
        >
          <ToolDirectory />
        </Suspense>
      </div>
    </div>
  );
}
