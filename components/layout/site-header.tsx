import Link from "next/link";
import { Wrench } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { MobileNav } from "./mobile-nav";
import { NAV_LINKS } from "./nav-links";
import { SearchDialog } from "@/components/navigation/search-dialog";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="relative mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight" aria-label="devutils.info home">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <Wrench aria-hidden className="size-4" />
          </span>
          <span>
            devutils<span className="text-muted-foreground">.info</span>
          </span>
        </Link>
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <SearchDialog />
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
