"use client";

import { useId, useMemo, useState } from "react";
import { useNow } from "./use-now";
import { Eraser, FileInput } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/tools/copy-button";
import { StatusMessage } from "@/components/tools/status-message";
import { ToolPanel } from "@/components/tools/tool-panel";
import { decodeJwt, timeClaims, tokenStatus } from "@/features/security/jwt";
import { encodeBase64 } from "@/features/encoding/base64";
import { formatUtc, formatLocal } from "@/features/datetime/timestamp";
import { checkInputSize } from "@/lib/limits";

const TOOL = "jwt-decoder";

/** Builds an obviously fake, unsigned sample token (expired) — no real credentials. */
function sampleToken(): string {
  const seg = (o: unknown) => encodeBase64(JSON.stringify(o), true);
  return [
    seg({ alg: "HS256", typ: "JWT" }),
    seg({ sub: "1234567890", name: "Ada Lovelace", roles: ["admin"], iss: "https://auth.example.com", iat: 1735689600, exp: 1735693200 }),
    "c2FtcGxlLXNpZ25hdHVyZS1ub3QtdmVyaWZpZWQ",
  ].join(".");
}

export default function JwtDecoderTool() {
  const [token, setToken] = useState("");
  const id = useId();
  const nowMs = useNow(5000);

  const result = useMemo(() => {
    if (!token.trim()) return null;
    const big = checkInputSize(token, 256 * 1024);
    if (big) return { ok: false as const, error: big };
    return decodeJwt(token);
  }, [token]);

  const decoded = result?.ok ? result.value : null;
  const headerJson = decoded ? JSON.stringify(decoded.header, null, 2) : "";
  const payloadJson = decoded ? JSON.stringify(decoded.payload, null, 2) : "";
  const times = decoded ? timeClaims(decoded.payload) : null;
  const status = decoded && nowMs !== null ? tokenStatus(decoded.payload, new Date(nowMs)) : null;
  const alg = decoded && typeof decoded.header.alg === "string" ? decoded.header.alg : null;

  return (
    <div className="flex flex-col gap-4">
      <StatusMessage kind="warning" title="Decoding does not verify the signature.">
        This tool only reads what a token claims. A decoded token may be forged or tampered with — always verify signatures on your server.
      </StatusMessage>

      <ToolPanel
        title="Encoded JWT"
        htmlFor={`${id}-in`}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setToken(sampleToken())}>
              <FileInput /> Sample
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setToken("")}>
              <Eraser /> Clear
            </Button>
          </>
        }
      >
        <Textarea
          id={`${id}-in`}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="eyJhbGciOi… (paste a JWT; a 'Bearer ' prefix is fine)"
          className="min-h-28 break-all"
          aria-invalid={result?.ok === false}
        />
      </ToolPanel>

      {result?.ok === false && <StatusMessage kind="error" title={result.error} />}

      {decoded && (
        <>
          {status && (
            <StatusMessage
              kind={status.state === "expired" || status.state === "not-yet-valid" ? "error" : status.state === "valid-time" ? "success" : "info"}
              title={status.state === "expired" ? "Token expired" : status.state === "not-yet-valid" ? "Token not yet valid" : status.state === "valid-time" ? "Within its validity period" : "No expiry"}
            >
              {status.message} (Based on your device clock; signature not checked.)
            </StatusMessage>
          )}
          {alg?.toLowerCase() === "none" && (
            <StatusMessage kind="warning" title='This token uses "alg": "none".'>
              It is unsigned. Servers must reject unsigned tokens unless explicitly intended.
            </StatusMessage>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <ToolPanel title="Header" actions={<CopyButton value={headerJson} tool={TOOL} label="Copy header" />}>
              <pre tabIndex={0} className="max-h-80 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-[13px]">{headerJson}</pre>
              {alg && (
                <p className="text-xs text-muted-foreground">
                  Algorithm: <Badge variant="outline">{alg}</Badge>
                </p>
              )}
            </ToolPanel>
            <ToolPanel title="Payload (claims)" actions={<CopyButton value={payloadJson} tool={TOOL} label="Copy payload" />}>
              <pre tabIndex={0} className="max-h-80 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-[13px]">{payloadJson}</pre>
            </ToolPanel>
          </div>

          {times && (times.claims.length > 0 || times.invalid.length > 0) && (
            <ToolPanel title="Time claims">
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-medium">Claim</th>
                      <th scope="col" className="px-3 py-2 font-medium">Value</th>
                      <th scope="col" className="px-3 py-2 font-medium">UTC</th>
                      <th scope="col" className="px-3 py-2 font-medium">Local</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {times.claims.map((c) => (
                      <tr key={c.claim}>
                        <th scope="row" className="px-3 py-2 text-left font-medium">
                          {c.label} <code className="text-xs text-muted-foreground">{c.claim}</code>
                        </th>
                        <td className="px-3 py-2 font-mono">{c.seconds}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{formatUtc(c.date)}</td>
                        <td className="px-3 py-2 whitespace-nowrap" suppressHydrationWarning>
                          {formatLocal(c.date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {times.invalid.map((m) => (
                <StatusMessage key={m} kind="warning" title={m} />
              ))}
            </ToolPanel>
          )}

          <ToolPanel title="Signature">
            <p className="rounded-md border bg-muted/40 p-3 font-mono text-[13px] break-all">{decoded.signature || <em>(empty — unsigned token)</em>}</p>
            <p className="text-xs text-muted-foreground">Shown for reference only. Verifying it requires the issuer&apos;s secret or public key and is not performed here.</p>
          </ToolPanel>
        </>
      )}
    </div>
  );
}
