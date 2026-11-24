import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type Kind = "error" | "success" | "warning" | "info";

const STYLES: Record<Kind, { icon: typeof Info; cls: string; prefix: string }> = {
  error: { icon: AlertCircle, cls: "border-destructive/40 bg-destructive/5 text-destructive", prefix: "Error" },
  success: { icon: CheckCircle2, cls: "border-success/40 bg-success/5 text-success", prefix: "Success" },
  warning: { icon: TriangleAlert, cls: "border-warning/40 bg-warning/5 text-warning", prefix: "Warning" },
  info: { icon: Info, cls: "border-border bg-muted/50 text-muted-foreground", prefix: "Note" },
};

/**
 * Status banner. Always shows an icon AND a text prefix so meaning never relies
 * on colour alone; errors are announced to screen readers via role="alert".
 */
export function StatusMessage({ kind, title, children, className, id }: { kind: Kind; title?: string; children?: React.ReactNode; className?: string; id?: string }) {
  const s = STYLES[kind];
  const Icon = s.icon;
  return (
    <div id={id} role={kind === "error" ? "alert" : "status"} className={cn("flex gap-2.5 rounded-lg border px-3 py-2.5 text-sm", s.cls, className)}>
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        <p className="font-medium">
          <span className="sr-only">{s.prefix}: </span>
          {title}
        </p>
        {children && <div className="mt-0.5 break-words text-foreground/80">{children}</div>}
      </div>
    </div>
  );
}
