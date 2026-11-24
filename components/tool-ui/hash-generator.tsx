"use client";

import { useEffect, useId, useState } from "react";
import { Eraser, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Checkbox } from "@/components/ui/checkbox";
import { CopyButton } from "@/components/tools/copy-button";
import { StatusMessage } from "@/components/tools/status-message";
import { ToolPanel, Toolbar } from "@/components/tools/tool-panel";
import { HASH_ALGORITHMS, digest, toBase64, toHex, type HashAlgorithm } from "@/features/security/hash";
import { checkInputSize, MAX_FILE_BYTES } from "@/lib/limits";
import { formatBytes } from "@/lib/utils";
import { track } from "@/lib/analytics";

const TOOL = "hash-generator";

type Digests = Partial<Record<HashAlgorithm, ArrayBuffer>>;

export default function HashGeneratorTool() {
  const id = useId();
  const [source, setSource] = useState<"text" | "file">("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [encoding, setEncoding] = useState<"hex" | "base64">("hex");
  const [upper, setUpper] = useState(false);
  const [compare, setCompare] = useState("");
  const [digests, setDigests] = useState<Digests>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setError(null);
      let data: ArrayBuffer | Uint8Array;
      if (source === "text") {
        const big = checkInputSize(text);
        if (big) return setError(big);
        data = new TextEncoder().encode(text);
      } else {
        if (!file) return setDigests({});
        if (file.size > MAX_FILE_BYTES) return setError(`File is ${formatBytes(file.size)}; the limit is ${formatBytes(MAX_FILE_BYTES)}.`);
        setBusy(true);
        data = await file.arrayBuffer();
      }
      try {
        const entries = await Promise.all(HASH_ALGORITHMS.map(async (a) => [a, await digest(a, data as BufferSource)] as const));
        if (!cancelled) setDigests(Object.fromEntries(entries));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Hashing failed.");
        track("tool_error", { tool: TOOL });
      } finally {
        if (!cancelled) setBusy(false);
      }
    };
    const t = setTimeout(run, source === "text" ? 120 : 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [source, text, file]);

  const render = (b: ArrayBuffer) => (encoding === "hex" ? toHex(b, upper) : toBase64(b));
  const cmp = compare.trim().toLowerCase();
  const showResults = source === "text" || file;

  return (
    <div className="flex flex-col gap-4">
      <StatusMessage kind="info" title="Not for password storage.">
        SHA hashes are fast by design. Store passwords with Argon2id, scrypt or bcrypt instead.
      </StatusMessage>
      <Toolbar>
        <Segmented label="Input source" value={source} onChange={setSource} options={[{ value: "text", label: "Text" }, { value: "file", label: "File" }]} />
        <Segmented label="Output encoding" value={encoding} onChange={setEncoding} options={[{ value: "hex", label: "Hex" }, { value: "base64", label: "Base64" }]} />
        {encoding === "hex" && <Checkbox label="Uppercase" checked={upper} onChange={(e) => setUpper(e.target.checked)} />}
      </Toolbar>

      {source === "text" ? (
        <ToolPanel
          title="Text to hash (UTF-8)"
          htmlFor={`${id}-text`}
          actions={
            <Button variant="ghost" size="sm" onClick={() => setText("")}>
              <Eraser /> Clear
            </Button>
          }
        >
          <Textarea id={`${id}-text`} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or paste text… (an empty input is hashed too)" className="min-h-32" />
        </ToolPanel>
      ) : (
        <ToolPanel title="File to hash" htmlFor={`${id}-file`}>
          <label htmlFor={`${id}-file`} className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-sm text-muted-foreground hover:bg-accent/40">
            <FileUp aria-hidden className="size-6" />
            {file ? (
              <span>
                <strong className="text-foreground">{file.name}</strong> · {formatBytes(file.size)}
              </span>
            ) : (
              <span>Choose a file (read locally, max {formatBytes(MAX_FILE_BYTES)})</span>
            )}
          </label>
          <input id={`${id}-file`} type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </ToolPanel>
      )}

      {error && <StatusMessage kind="error" title={error} />}

      {showResults && !error && (
        <ToolPanel title={busy ? "Hashes (computing…)" : "Hashes"}>
          <ul className="divide-y rounded-md border">
            {HASH_ALGORITHMS.map((a) => {
              const d = digests[a];
              const v = d ? render(d) : "";
              const match = cmp && v && v.toLowerCase() === cmp;
              return (
                <li key={a} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:gap-3">
                  <span className="w-20 shrink-0 text-sm font-semibold">
                    {a}
                    {a === "SHA-1" && <span className="block text-xs font-normal text-warning">legacy</span>}
                  </span>
                  <code className="min-w-0 flex-1 font-mono text-[13px] break-all">{v || "…"}</code>
                  {match && <span className="text-xs font-medium text-success">✓ Matches</span>}
                  <CopyButton value={v} disabled={!v} tool={TOOL} iconOnly label={`Copy ${a}`} variant="ghost" />
                </li>
              );
            })}
          </ul>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-cmp`} className="text-sm font-medium">
              Compare with a known hash (optional)
            </label>
            <Input id={`${id}-cmp`} value={compare} onChange={(e) => setCompare(e.target.value)} placeholder="Paste an expected checksum" className="font-mono" />
            {cmp && (
              <p role="status" className="text-sm">
                {HASH_ALGORITHMS.some((a) => digests[a] && render(digests[a]!).toLowerCase() === cmp) ? (
                  <span className="text-success">✓ Match found.</span>
                ) : (
                  <span className="text-destructive">✗ No algorithm produced this value.</span>
                )}
              </p>
            )}
          </div>
        </ToolPanel>
      )}
    </div>
  );
}
