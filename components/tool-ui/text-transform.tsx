"use client";

import { useId } from "react";
import { ArrowUpDown, Eraser, FileInput } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/tools/copy-button";
import { StatusMessage } from "@/components/tools/status-message";
import { ToolPanel } from "@/components/tools/tool-panel";

interface Props {
  tool: string;
  input: string;
  setInput: (s: string) => void;
  output: string;
  error: string | null;
  inputLabel: string;
  outputLabel: string;
  sample: string;
  onSwap?: () => void;
  placeholder?: string;
}

/** Shared input → output layout for live text conversion tools. */
export function TextTransform({ tool, input, setInput, output, error, inputLabel, outputLabel, sample, onSwap, placeholder }: Props) {
  const id = useId();
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel
        title={inputLabel}
        htmlFor={`${id}-in`}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setInput(sample)}>
              <FileInput /> Sample
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setInput("")}>
              <Eraser /> Clear
            </Button>
          </>
        }
      >
        <Textarea
          id={`${id}-in`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="min-h-[400px]"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
        />
      </ToolPanel>
      <ToolPanel
        title={outputLabel}
        expandable
        htmlFor={`${id}-out`}
        actions={
          <>
            {onSwap && (
              <Button variant="ghost" size="sm" onClick={onSwap} disabled={!output}>
                <ArrowUpDown /> Swap
              </Button>
            )}
            <CopyButton value={output} disabled={!output} tool={tool} />
          </>
        }
      >
        <Textarea data-fs-fill id={`${id}-out`} value={output} readOnly className="min-h-[400px] bg-muted/40" placeholder="Result appears here" />
        {error && (
          <StatusMessage kind="error" title={error} id={`${id}-err`} />
        )}
      </ToolPanel>
    </div>
  );
}
