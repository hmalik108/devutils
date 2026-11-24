"use client";

import { useId, useMemo, useState } from "react";
import { useNow } from "./use-now";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { CopyButton } from "@/components/tools/copy-button";
import { StatusMessage } from "@/components/tools/status-message";
import { ToolPanel } from "@/components/tools/tool-panel";
import { fromTimestamp, fromDateString, type ConvertedTime, type TimestampUnit } from "@/features/datetime/timestamp";
import { relative } from "@/features/security/jwt";

const TOOL = "unix-timestamp-converter";

function Row({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <dt className="w-36 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className={`min-w-0 flex-1 break-all text-sm ${mono ? "font-mono" : ""}`}>{value}</dd>
      <CopyButton value={value} iconOnly variant="ghost" tool={TOOL} label={`Copy ${label}`} />
    </div>
  );
}

function Results({ t }: { t: ConvertedTime }) {
  return (
    <dl className="divide-y rounded-md border">
      <Row label="Unix (seconds)" value={String(t.seconds)} />
      <Row label="Unix (milliseconds)" value={String(t.milliseconds)} />
      <Row label="ISO 8601 (UTC)" value={t.iso} />
      <Row label="UTC" value={t.utc} mono={false} />
      <Row label={`Local (${t.timeZone})`} value={t.local} mono={false} />
      <Row label="Relative" value={relative(new Date(t.ms))} mono={false} />
    </dl>
  );
}

function CurrentTime() {
  const now = useNow(1000);
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
      <span className="font-medium">Current Unix time</span>
      <span className="font-mono tabular-nums" aria-live="off">
        {now === null ? "—" : Math.floor(now / 1000)} <span className="text-muted-foreground">s</span>
      </span>
      <span className="font-mono tabular-nums text-muted-foreground">{now === null ? "—" : now} ms <span className="sr-only">(updates every second)</span></span>
    </div>
  );
}

export default function TimestampConverterTool() {
  const id = useId();
  const [ts, setTs] = useState("");
  const [unit, setUnit] = useState<TimestampUnit | "auto">("auto");
  const [date, setDate] = useState("");
  const [assume, setAssume] = useState<"local" | "utc">("local");

  const tsResult = useMemo(() => (ts.trim() ? fromTimestamp(ts, unit) : null), [ts, unit]);
  const dateResult = useMemo(() => (date.trim() ? fromDateString(date, assume) : null), [date, assume]);

  return (
    <div className="flex flex-col gap-6">
      <CurrentTime />

      <ToolPanel title="Timestamp → date" htmlFor={`${id}-ts`}>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id={`${id}-ts`}
            value={ts}
            onChange={(e) => setTs(e.target.value)}
            inputMode="numeric"
            placeholder="e.g. 1700000000 or 1700000000000"
            className="max-w-xs font-mono"
            aria-invalid={tsResult?.ok === false}
          />
          <Segmented
            label="Timestamp unit"
            value={unit}
            onChange={setUnit}
            options={[
              { value: "auto", label: "Auto" },
              { value: "seconds", label: "Seconds" },
              { value: "milliseconds", label: "Milliseconds" },
            ]}
          />
          <Button variant="secondary" onClick={() => { setTs(String(Math.floor(Date.now() / 1000))); setUnit("auto"); }}>
            <Clock /> Now
          </Button>
        </div>
        {tsResult?.ok === false && <StatusMessage kind="error" title={tsResult.error} />}
        {tsResult?.ok && (
          <>
            <p role="status" className="text-xs text-muted-foreground">
              Interpreted as <strong className="text-foreground">{tsResult.value.unit}</strong>
              {tsResult.value.inferred && " (inferred from magnitude — choose a unit to override)"}.
            </p>
            <Results t={tsResult.value} />
          </>
        )}
      </ToolPanel>

      <ToolPanel title="Date → timestamp" htmlFor={`${id}-date`}>
        <div className="flex flex-wrap items-center gap-2">
          <Input id={`${id}-date`} value={date} onChange={(e) => setDate(e.target.value)} placeholder="e.g. 2026-11-23 14:30 or 2026-11-23T14:30:00Z" className="max-w-sm font-mono" aria-invalid={dateResult?.ok === false} />
          <Segmented label="Time zone for dates without an offset" value={assume} onChange={setAssume} options={[{ value: "local", label: "Local time" }, { value: "utc", label: "UTC" }]} />
          <Button variant="secondary" onClick={() => setDate(new Date().toISOString())}>
            <Clock /> Now
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Dates with an explicit offset (Z or ±hh:mm) ignore this setting.</p>
        {dateResult?.ok === false && <StatusMessage kind="error" title={dateResult.error} />}
        {dateResult?.ok && <Results t={dateResult.value} />}
      </ToolPanel>
    </div>
  );
}
