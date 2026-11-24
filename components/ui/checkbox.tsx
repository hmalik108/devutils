import * as React from "react";
import { cn } from "@/lib/utils";

export function Checkbox({ label, className, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & { label: React.ReactNode }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2 text-sm select-none", className)}>
      <input type="checkbox" className="size-4 cursor-pointer rounded border-input accent-primary" {...props} />
      {label}
    </label>
  );
}
