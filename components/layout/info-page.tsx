import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

export function InfoPage({ title, path, updated, children }: { title: string; path: string; updated?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: title, path }]} />
      <article className="prose-tool mt-4">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {updated && <p className="!mt-1 text-sm">Last updated: {updated}</p>}
        {children}
      </article>
    </div>
  );
}
