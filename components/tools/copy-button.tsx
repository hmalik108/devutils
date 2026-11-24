"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { track } from "@/lib/analytics";

interface CopyButtonProps extends Omit<ButtonProps, "onClick" | "value"> {
  value: string | (() => string);
  tool?: string;
  label?: string;
  /** Icon-only button; label becomes the accessible name. */
  iconOnly?: boolean;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers/contexts without the async clipboard API.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export function CopyButton({ value, tool, label = "Copy", iconOnly, disabled, variant = "secondary", size = "sm", ...rest }: CopyButtonProps) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), 1600);
    return () => clearTimeout(t);
  }, [state]);

  const text = state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : label;
  return (
    <Button
      variant={variant}
      size={iconOnly ? "icon" : size}
      disabled={disabled}
      aria-label={iconOnly ? text : undefined}
      title={iconOnly ? text : undefined}
      onClick={async () => {
        const v = typeof value === "function" ? value() : value;
        const ok = await copyText(v);
        setState(ok ? "copied" : "failed");
        if (ok) track("copy_output", { tool });
      }}
      {...rest}
    >
      {state === "copied" ? <Check /> : <Copy />}
      {!iconOnly && <span>{text}</span>}
      <span className="sr-only" aria-live="polite">
        {iconOnly && state !== "idle" ? text : ""}
      </span>
    </Button>
  );
}
