"use client";

import { Download } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { downloadText } from "@/lib/download";
import { track } from "@/lib/analytics";

interface DownloadButtonProps extends Omit<ButtonProps, "onClick" | "content"> {
  content: string | (() => string);
  filename: string;
  mime?: string;
  tool?: string;
  label?: string;
}

export function DownloadButton({ content, filename, mime, tool, label = "Download", variant = "secondary", size = "sm", ...rest }: DownloadButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => {
        downloadText(filename, typeof content === "function" ? content() : content, mime);
        track("download_output", { tool });
      }}
      {...rest}
    >
      <Download />
      <span>{label}</span>
    </Button>
  );
}
