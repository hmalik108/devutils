"use client";

import { useId, useMemo, useState } from "react";
import { useNow } from "./use-now";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Segmented } from "@/components/ui/segmented";
import { CopyButton } from "@/components/tools/copy-button";
import { StatusMessage } from "@/components/tools/status-message";
import { ToolPanel } from "@/components/tools/tool-panel";
import {
  FIELDS,
  MONTH_LONG,
  DOW_LONG,
  CRON_EXAMPLES,
  builderToCron,
  defaultBuilder,
  explainCron,
  nextRuns,
  parseCron,
  type BuilderField,
  type BuilderMode,
  type BuilderState,
  type FieldSpec,
} from "@/features/devops/cron";
import { cn } from "@/lib/utils";

const TOOL = "cron-generator";

const MODE_LABEL: Record<BuilderMode, string> = { every: "Every", step: "Every N", specific: "Specific", range: "Range" };

function valueLabel(spec: FieldSpec, n: number, short = false) {
  if (spec.name === "month") return short ? MONTH_LONG[n - 1].slice(0, 3) : MONTH_LONG[n - 1];
  if (spec.name === "dayOfWeek") return short ? DOW_LONG[n].slice(0, 3) : DOW_LONG[n];
  return String(n);
}

function FieldEditor({ spec, field, onChange }: { spec: FieldSpec; field: BuilderField; onChange: (f: BuilderField) => void }) {
  const id = useId();
  const max = spec.name === "dayOfWeek" ? 6 : spec.max;
  const values = Array.from({ length: max - spec.min + 1 }, (_, i) => spec.min + i);
  const unit = spec.label.toLowerCase();
  return (
    <fieldset className="rounded-lg border p-3">
      <legend className="px-1 text-sm font-semibold">{spec.label}</legend>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`${id}-mode`} className="sr-only">
          {spec.label} mode
        </label>
        <Select id={`${id}-mode`} value={field.mode} onChange={(e) => onChange({ ...field, mode: e.target.value as BuilderMode })}>
          {(Object.keys(MODE_LABEL) as BuilderMode[]).map((m) => (
            <option key={m} value={m}>
              {MODE_LABEL[m]} {m === "every" ? unit : ""}
            </option>
          ))}
        </Select>
        {field.mode === "step" && (
          <span className="flex items-center gap-2 text-sm">
            <label htmlFor={`${id}-step`}>every</label>
            <Input id={`${id}-step`} type="number" min={1} max={max} value={Number.isNaN(field.step) ? "" : field.step} onChange={(e) => onChange({ ...field, step: e.target.valueAsNumber })} className="w-20" />
            <span>{unit}(s)</span>
          </span>
        )}
        {field.mode === "range" && (
          <span className="flex items-center gap-2 text-sm">
            <label htmlFor={`${id}-from`} className="sr-only">
              From
            </label>
            <Select id={`${id}-from`} value={field.from} onChange={(e) => onChange({ ...field, from: Number(e.target.value) })}>
              {values.map((v) => (
                <option key={v} value={v}>
                  {valueLabel(spec, v)}
                </option>
              ))}
            </Select>
            <span>through</span>
            <label htmlFor={`${id}-to`} className="sr-only">
              To
            </label>
            <Select id={`${id}-to`} value={field.to} onChange={(e) => onChange({ ...field, to: Number(e.target.value) })}>
              {values.map((v) => (
                <option key={v} value={v}>
                  {valueLabel(spec, v)}
                </option>
              ))}
            </Select>
          </span>
        )}
      </div>
      {field.mode === "specific" && (
        <div role="group" aria-label={`${spec.label} values`} className={cn("mt-3 grid gap-1", spec.name === "minute" ? "grid-cols-10" : spec.name === "dayOfMonth" ? "grid-cols-8 sm:grid-cols-11" : spec.name === "hour" ? "grid-cols-8 sm:grid-cols-12" : "grid-cols-4 sm:grid-cols-7")}>
          {values.map((v) => {
            const on = field.values.includes(v);
            return (
              <button
                key={v}
                type="button"
                aria-pressed={on}
                aria-label={valueLabel(spec, v)}
                onClick={() => onChange({ ...field, values: on ? field.values.filter((x) => x !== v) : [...field.values, v] })}
                className={cn("cursor-pointer rounded border px-1 py-1 text-xs tabular-nums", on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent")}
              >
                {valueLabel(spec, v, true)}
              </button>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}

export default function CronGeneratorTool() {
  const id = useId();
  const [builder, setBuilder] = useState<BuilderState>(defaultBuilder);
  const [expr, setExpr] = useState("0 * * * *");
  const [manual, setManual] = useState(false);
  const [tz, setTz] = useState<"local" | "utc">("local");
  const nowMs = useNow(60_000);

  const built = useMemo(() => builderToCron(builder), [builder]);

  const updateField = (name: FieldSpec["name"], f: BuilderField) => {
    const next = { ...builder, [name]: f };
    setBuilder(next);
    const r = builderToCron(next);
    if (r.ok) {
      setExpr(r.value);
      setManual(false);
    }
  };

  const parsed = useMemo(() => parseCron(expr), [expr]);
  const explanation = parsed.ok ? explainCron(parsed.value) : null;
  const runs = useMemo(() => (parsed.ok && nowMs !== null ? nextRuns(parsed.value, 5, new Date(nowMs), tz) : []), [parsed, nowMs, tz]);
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("en-US", { timeZone: tz === "utc" ? "UTC" : undefined, weekday: "short", year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZoneName: "short" }).format(d);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 md:grid-cols-2">
        {FIELDS.map((spec) => (
          <FieldEditor key={spec.name} spec={spec} field={builder[spec.name]} onChange={(f) => updateField(spec.name, f)} />
        ))}
      </div>
      {!built.ok && (
        <StatusMessage kind="error" title="The builder settings are incomplete — the expression was not updated.">
          <ul className="list-disc pl-4">
            {built.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </StatusMessage>
      )}

      <ToolPanel title="Cron expression" htmlFor={`${id}-expr`} actions={<CopyButton value={expr} disabled={!parsed.ok} tool={TOOL} />}>
        <Input
          id={`${id}-expr`}
          value={expr}
          onChange={(e) => {
            setExpr(e.target.value);
            setManual(true);
          }}
          className="h-12 font-mono text-lg"
          spellCheck={false}
          aria-invalid={!parsed.ok}
          aria-describedby={`${id}-explain`}
        />
        <p className="font-mono text-xs text-muted-foreground" aria-hidden>
          minute · hour · day-of-month · month · day-of-week
        </p>
        <div id={`${id}-explain`}>
          {parsed.ok ? (
            <StatusMessage kind="success" title={explanation ?? ""} />
          ) : (
            <StatusMessage kind="error" title="Invalid cron expression">
              {parsed.error}
            </StatusMessage>
          )}
        </div>
        {manual && <p className="text-xs text-muted-foreground">You edited the expression directly. Changing the builder above will replace it.</p>}
      </ToolPanel>

      {parsed.ok && (
        <ToolPanel title="Next 5 runs" actions={<Segmented label="Preview time zone" value={tz} onChange={setTz} options={[{ value: "local", label: "My time zone" }, { value: "utc", label: "UTC" }]} />}>
          {runs.length ? (
            <ol className="divide-y rounded-md border text-sm">
              {runs.map((d) => (
                <li key={d.getTime()} className="px-3 py-2 font-mono tabular-nums">
                  {fmt(d)}
                </li>
              ))}
            </ol>
          ) : (
            nowMs !== null && <StatusMessage kind="warning" title="This schedule never runs.">No matching date exists (for example, 30 February).</StatusMessage>
          )}
          <p className="text-xs text-muted-foreground">
            Preview only. Cron runs in the time zone of the system executing it (often UTC), and daylight-saving behavior differs between implementations.
          </p>
        </ToolPanel>
      )}

      <ToolPanel title="Common expressions">
        <ul className="grid gap-2 sm:grid-cols-2">
          {CRON_EXAMPLES.map((ex) => (
            <li key={ex.expression}>
              <button
                type="button"
                onClick={() => {
                  setExpr(ex.expression);
                  setManual(true);
                }}
                className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <code className="font-mono">{ex.expression}</code>
                <span className="text-muted-foreground">{ex.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </ToolPanel>
    </div>
  );
}
