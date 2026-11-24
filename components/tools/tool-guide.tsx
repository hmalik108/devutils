import type { Tool } from "@/lib/tools-registry";
import type { ToolContent } from "@/content/types";
import { RichText } from "./rich-text";

/** Long-form help for one tool: about, how-to, examples, extra sections and FAQ. */
export function ToolGuide({ tool, content, headingLevel = 2 }: { tool: Tool; content: ToolContent; headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as "h2" | "h3";
  const Sub = `h${headingLevel + 1}` as "h3" | "h4";
  return (
    <div className="prose-tool min-w-0">
      <H>About the {tool.name}</H>
      {content.intro.map((p, i) => (
        <p key={i}>
          <RichText text={p} />
        </p>
      ))}

      <H>How to use</H>
      <ol>
        {content.howTo.map((s, i) => (
          <li key={i}>
            <RichText text={s} />
          </li>
        ))}
      </ol>

      <H>Examples</H>
      {content.examples.map((ex, i) => (
        <div key={i}>
          <Sub>{ex.title}</Sub>
          {ex.description && (
            <p>
              <RichText text={ex.description} />
            </p>
          )}
          {ex.input !== undefined && (
            <>
              <p className="!mb-1 text-xs font-medium tracking-wide uppercase">Input</p>
              <pre>
                <code>{ex.input === "" ? "(empty string)" : ex.input}</code>
              </pre>
            </>
          )}
          {ex.output !== undefined && (
            <>
              <p className="!mb-1 text-xs font-medium tracking-wide uppercase">Output</p>
              <pre>
                <code>{ex.output}</code>
              </pre>
            </>
          )}
        </div>
      ))}

      {content.sections?.map((s) => (
        <section key={s.heading}>
          <H>{s.heading}</H>
          {s.paragraphs?.map((p, i) => (
            <p key={i}>
              <RichText text={p} />
            </p>
          ))}
          {s.code && (
            <pre>
              <code>{s.code}</code>
            </pre>
          )}
          {s.bullets && (
            <ul>
              {s.bullets.map((b, i) => (
                <li key={i}>
                  <RichText text={b} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <H>Frequently asked questions</H>
      <div className="divide-y rounded-lg border">
        {content.faqs.map((f, i) => (
          <details key={i} className="group px-4 py-3 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
              <Sub className="!m-0 text-base">{f.q}</Sub>
              <span aria-hidden className="text-muted-foreground transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="!mb-0">
              <RichText text={f.a} />
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
