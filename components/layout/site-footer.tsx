import Link from "next/link";
import { activeCategories } from "@/lib/tools-registry";
import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-semibold">{siteConfig.name}</p>
          <p className="mt-2 text-sm text-muted-foreground">{siteConfig.tagline} Free tools that run in your browser — your input never leaves your device.</p>
        </div>
        <nav aria-label="Categories">
          <p className="text-sm font-semibold">Categories</p>
          <ul className="mt-3 space-y-2 text-sm">
            {activeCategories().map((c) => (
              <li key={c.slug}>
                <Link href={`/${c.slug}`} className="text-muted-foreground hover:text-foreground">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Site">
          <p className="text-sm font-semibold">Site</p>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              ["/tools", "All tools"],
              ["/about", "About"],
              ["/contact", "Contact"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-muted-foreground hover:text-foreground">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Legal">
          <p className="text-sm font-semibold">Legal</p>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              ["/privacy-policy", "Privacy Policy"],
              ["/terms", "Terms of Use"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-muted-foreground hover:text-foreground">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t py-6 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} {siteConfig.name}. All tools are free to use.</div>
    </footer>
  );
}
