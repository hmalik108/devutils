"use client";

import { useMemo, useState } from "react";
import { Segmented } from "@/components/ui/segmented";
import { Checkbox } from "@/components/ui/checkbox";
import { Toolbar } from "@/components/tools/tool-panel";
import { encodeBase64, decodeBase64 } from "@/features/encoding/base64";
import { checkInputSize } from "@/lib/limits";
import { TextTransform } from "./text-transform";

type Mode = "encode" | "decode";

export default function Base64Tool() {
  const [mode, setMode] = useState<Mode>("encode");
  const [urlSafe, setUrlSafe] = useState(false);
  const [input, setInput] = useState("");

  const { output, error } = useMemo(() => {
    if (!input) return { output: "", error: null };
    const big = checkInputSize(input);
    if (big) return { output: "", error: big };
    if (mode === "encode") return { output: encodeBase64(input, urlSafe), error: null };
    const r = decodeBase64(input);
    return r.ok ? { output: r.value, error: null } : { output: "", error: r.error };
  }, [input, mode, urlSafe]);

  return (
    <div className="flex flex-col gap-4">
      <Toolbar>
        <Segmented label="Direction" value={mode} onChange={setMode} options={[{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }]} />
        {mode === "encode" && <Checkbox label="URL-safe (base64url)" checked={urlSafe} onChange={(e) => setUrlSafe(e.target.checked)} />}
      </Toolbar>
      <TextTransform
        tool="base64-encoder-decoder"
        input={input}
        setInput={setInput}
        output={output}
        error={error}
        inputLabel={mode === "encode" ? "Text to encode" : "Base64 to decode"}
        outputLabel={mode === "encode" ? "Base64 output" : "Decoded text"}
        sample={mode === "encode" ? "Hello, devutils! Grüße 👋" : "SGVsbG8sIGRldnV0aWxzISBHcsO8w59lIPCfkYs="}
        placeholder={mode === "encode" ? "Type or paste text…" : "Paste Base64…"}
        onSwap={() => {
          setInput(output);
          setMode(mode === "encode" ? "decode" : "encode");
        }}
      />
    </div>
  );
}
