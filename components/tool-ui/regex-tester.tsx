"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { CopyButton } from "@/components/tools/copy-button";
import { StatusMessage } from "@/components/tools/status-message";
import { ToolPanel } from "@/components/tools/tool-panel";
import { SAMPLE_PATTERNS, segmentText, type RegexRunResult } from "@/features/code/regex";
import type { RegexWorkerRequest } from "@/features/code/regex.worker";
import { SupersededError, WorkerTimeoutError } from "@/lib/worker-client";
import { checkInputSize } from "@/lib/limits";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { useDebounced } from "./use-debounced";
import { useTaskWorker } from "./use-task-worker";

const TOOL = "regex-tester";
const TIMEOUT_MS = 1500;
const FLAGS: { flag: string; label: string }[] = [
  { flag: "g", label: "global" },
  { flag: "i", label: "ignore case" },
  { flag: "m", label: "multiline" },
  { flag: "s", label: "dotAll" },
  { flag: "u", label: "unicode" },
  { flag: "y", label: "sticky" },
];

const createWorker = () => new Worker(new URL("../../features/code/regex.worker.ts", import.meta.url), { type: "module" });

type State = { status: "idle" } | { status: "done"; result: RegexRunResult; text: string } | { status: "timeout"; message: string };

export default function RegexTesterTool() {
  const id = useId();
  const [pattern, setPattern] = useState(SAMPLE_PATTERNS[0].pattern);
  const [flags, setFlags] = useState(SAMPLE_PATTERNS[0].flags);
  const [text, setText] = useState(SAMPLE_PATTERNS[0].sample);
  const [state, setState] = useState<State>({ status: "idle" });
  const worker = useTaskWorker<Omit<RegexWorkerRequest, "id">, RegexRunResult>(createWorker, TIMEOUT_MS);

  // Memoise so the debounced value only changes when an input actually changes.
  const latest = useMemo(() => ({ pattern, flags, text }), [pattern, flags, text]);
  const req = useDebounced(latest, 150);

  const tooBig = useMemo(() => checkInputSize(req.text, 1024 * 1024), [req.text]);

  useEffect(() => {
    if (tooBig) return;
    let cancelled = false;
    worker()
      .run(req)
      .then((result) => {
        if (cancelled) return;
        setState({ status: "done", result, text: req.text });
        if (req.pattern) track(result.ok ? "tool_success" : "tool_error", { tool: TOOL });
      })
      .catch((e) => {
        if (cancelled || e instanceof SupersededError) return;
        setState({
          status: "timeout",
          message: e instanceof WorkerTimeoutError ? `Matching was stopped after ${TIMEOUT_MS / 1000}s. The pattern likely causes catastrophic backtracking.` : "Matching failed.",
        });
        track("tool_error", { tool: TOOL, action: "timeout" });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req]);

  const toggle = (f: string) => setFlags((cur) => (cur.includes(f) ? cur.replace(f, "") : cur + f));
  const result = useMemo<RegexRunResult | null>(() => (tooBig ? { ok: false, error: tooBig } : state.status === "done" ? state.result : null), [tooBig, state]);
  const matches = result?.ok ? result.matches : [];
  // Highlight against the exact text the result was computed for, so offsets always line up.
  const segments = useMemo(() => (state.status === "done" && state.result.ok && !tooBig ? segmentText(state.text, state.result.matches) : null), [state, tooBig]);
  const matchesText = matches.map((m) => m.text).join("\n");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor={`${id}-pattern`} className="text-sm font-semibold">
            Regular expression
          </label>
          <div className="flex items-center gap-2">
            <label htmlFor={`${id}-sample`} className="text-sm text-muted-foreground">
              Sample
            </label>
            <Select
              id={`${id}-sample`}
              defaultValue=""
              onChange={(e) => {
                const s = SAMPLE_PATTERNS[Number(e.target.value)];
                if (!s) return;
                setPattern(s.pattern);
                setFlags(s.flags);
                setText(s.sample);
              }}
            >
              <option value="" disabled>
                Choose a sample…
              </option>
              {SAMPLE_PATTERNS.map((s, i) => (
                <option key={s.name} value={i}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="flex items-center rounded-md border border-input bg-background font-mono shadow-xs focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring">
          <span aria-hidden className="pl-3 text-muted-foreground">/</span>
          <Input
            id={`${id}-pattern`}
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            className="border-0 font-mono shadow-none focus-visible:outline-none"
            aria-invalid={result?.ok === false}
            aria-describedby={`${id}-status`}
          />
          <span aria-hidden className="pr-3 text-muted-foreground">/{flags}</span>
        </div>
        <fieldset className="flex flex-wrap gap-1.5">
          <legend className="sr-only">Flags</legend>
          {FLAGS.map(({ flag, label }) => {
            const on = flags.includes(flag);
            return (
              <button
                key={flag}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(flag)}
                className={cn("cursor-pointer rounded-md border px-2.5 py-1 font-mono text-xs", on ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}
              >
                {flag} <span className="font-sans">{label}</span>
              </button>
            );
          })}
        </fieldset>
      </div>

      <div id={`${id}-status`}>
        {result?.ok === false && <StatusMessage kind="error" title="Invalid regular expression">{result.error}</StatusMessage>}
        {state.status === "timeout" && <StatusMessage kind="error" title="Pattern took too long">{state.message}</StatusMessage>}
        {result?.ok && pattern && (
          <p role="status" className="text-sm text-muted-foreground">
            <strong className="text-foreground">{matches.length.toLocaleString()}</strong> match{matches.length === 1 ? "" : "es"}
            {result.truncated && " (stopped at 10,000)"}
            {!flags.includes("g") && matches.length === 1 && " — add the g flag to find all matches"}
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ToolPanel
          title="Test text"
          htmlFor={`${id}-text`}
          actions={
            <Button variant="ghost" size="sm" onClick={() => setText("")}>
              <Eraser /> Clear
            </Button>
          }
        >
          <Textarea id={`${id}-text`} value={text} onChange={(e) => setText(e.target.value)} className="min-h-[400px]" placeholder="Text to test against…" />
        </ToolPanel>
        <ToolPanel title="Highlighted matches">
          <pre tabIndex={0} aria-label="Test text with matches highlighted" className="min-h-[400px] max-h-[640px] overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words">
            {segments
              ? segments.map((s, i) =>
                  s.match === undefined ? (
                    <span key={i}>{s.text}</span>
                  ) : (
                    <mark key={i} className={cn("rounded-sm px-px text-foreground underline decoration-dotted underline-offset-2", s.match % 2 ? "bg-mark/70" : "bg-mark")}>
                      {s.text}
                    </mark>
                  ),
                )
              : text}
          </pre>
        </ToolPanel>
      </div>

      {matches.length > 0 && (
        <ToolPanel title="Match details" actions={<CopyButton value={matchesText} tool={TOOL} label="Copy matches" />}>
          <div className="max-h-80 overflow-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">#</th>
                  <th scope="col" className="px-3 py-2 font-medium">Match</th>
                  <th scope="col" className="px-3 py-2 font-medium">Index</th>
                  <th scope="col" className="px-3 py-2 font-medium">Groups</th>
                </tr>
              </thead>
              <tbody className="divide-y font-mono text-[13px]">
                {matches.slice(0, 500).map((m, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-1.5 break-all">{m.text === "" ? <em className="text-muted-foreground">(empty)</em> : m.text}</td>
                    <td className="px-3 py-1.5">{m.index}</td>
                    <td className="px-3 py-1.5 break-all">
                      {m.named
                        ? Object.entries(m.named).map(([k, v]) => (
                            <span key={k} className="mr-3">
                              {k}=<span className="text-primary">{v ?? "undefined"}</span>
                            </span>
                          ))
                        : m.groups.map((g, gi) => (
                            <span key={gi} className="mr-3">
                              ${gi + 1}=<span className="text-primary">{g ?? "undefined"}</span>
                            </span>
                          ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {matches.length > 500 && <p className="p-2 text-center text-xs text-muted-foreground">Showing the first 500 of {matches.length.toLocaleString()} matches.</p>}
          </div>
        </ToolPanel>
      )}
    </div>
  );
}
