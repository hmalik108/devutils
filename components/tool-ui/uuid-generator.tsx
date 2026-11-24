"use client";

import { useId, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CopyButton } from "@/components/tools/copy-button";
import { DownloadButton } from "@/components/tools/download-button";
import { StatusMessage } from "@/components/tools/status-message";
import { ToolPanel, Toolbar } from "@/components/tools/tool-panel";
import { generateUuids, MAX_UUIDS } from "@/features/code/uuid";
import { track } from "@/lib/analytics";

const TOOL = "uuid-generator";

export default function UuidGeneratorTool() {
  const id = useId();
  const [count, setCount] = useState("5");
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [braces, setBraces] = useState(false);
  const [uuids, setUuids] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generate = () => {
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1 || n > MAX_UUIDS) {
      setError(`Quantity must be a whole number from 1 to ${MAX_UUIDS.toLocaleString()}.`);
      return;
    }
    try {
      setUuids(generateUuids(n, { uppercase, hyphens, braces }));
      setError(null);
      track("tool_execute", { tool: TOOL });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate UUIDs.");
    }
  };

  const all = uuids.join("\n");

  return (
    <div className="flex flex-col gap-4">
      <Toolbar className="items-end">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-count`} className="text-sm font-medium">
            Quantity
          </label>
          <Input
            id={`${id}-count`}
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_UUIDS}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
            className="w-28"
            aria-invalid={!!error}
          />
        </div>
        <Checkbox label="Uppercase" checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} />
        <Checkbox label="Hyphens" checked={hyphens} onChange={(e) => setHyphens(e.target.checked)} />
        <Checkbox label="Braces {…}" checked={braces} onChange={(e) => setBraces(e.target.checked)} />
        <Button onClick={generate}>
          <RefreshCw /> Generate
        </Button>
      </Toolbar>
      {error && <StatusMessage kind="error" title={error} />}

      <ToolPanel
        title={uuids.length ? `Generated UUIDs (${uuids.length})` : "Generated UUIDs"}
        actions={
          <>
            <CopyButton value={all} disabled={!uuids.length} tool={TOOL} label="Copy all" />
            <DownloadButton content={all + "\n"} filename="uuids.txt" disabled={!uuids.length} tool={TOOL} />
          </>
        }
      >
        {uuids.length === 0 ? (
          <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">Choose a quantity and click Generate.</p>
        ) : (
          <ol className="max-h-[480px] divide-y overflow-auto rounded-md border" aria-label="Generated UUIDs">
            {uuids.map((u, i) => (
              <li key={i} className="flex items-center gap-3 px-3 py-1.5">
                <span className="w-10 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                <code className="min-w-0 flex-1 font-mono text-[13px] break-all" data-testid="uuid">
                  {u}
                </code>
                <CopyButton value={u} iconOnly variant="ghost" tool={TOOL} label={`Copy UUID ${i + 1}`} />
              </li>
            ))}
          </ol>
        )}
      </ToolPanel>
    </div>
  );
}
