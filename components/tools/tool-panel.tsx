import { cn } from "@/lib/utils";

/** Labelled area used for tool inputs/outputs; actions render on the right. */
export function ToolPanel({ title, htmlFor, actions, children, className }: { title: string; htmlFor?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="text-sm font-semibold">
            {title}
          </label>
        ) : (
          <h2 className="text-sm font-semibold">{title}</h2>
        )}
        {actions && <div className="flex flex-wrap items-center gap-1.5">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export function Toolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-2", className)}>{children}</div>;
}
