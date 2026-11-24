"use client";

import { useMemo, useState } from "react";
import { Segmented } from "@/components/ui/segmented";
import { Checkbox } from "@/components/ui/checkbox";
import { Toolbar } from "@/components/tools/tool-panel";
import { encodeUrl, decodeUrl, type UrlMode } from "@/features/encoding/url";
import { checkInputSize } from "@/lib/limits";
import { TextTransform } from "./text-transform";

type Dir = "encode" | "decode";

export default function UrlEncoderTool() {
  const [dir, setDir] = useState<Dir>("encode");
  const [mode, setMode] = useState<UrlMode>("component");
  const [plus, setPlus] = useState(false);
  const [input, setInput] = useState("");

  const { output, error } = useMemo(() => {
    if (!input) return { output: "", error: null };
    const big = checkInputSize(input);
    if (big) return { output: "", error: big };
    const r = dir === "encode" ? encodeUrl(input, mode) : decodeUrl(input, { mode, plusAsSpace: plus });
    return r.ok ? { output: r.value, error: null } : { output: "", error: r.error };
  }, [input, dir, mode, plus]);

  return (
    <div className="flex flex-col gap-4">
      <Toolbar>
        <Segmented label="Direction" value={dir} onChange={setDir} options={[{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }]} />
        <Segmented label="Encoding scope" value={mode} onChange={setMode} options={[{ value: "component", label: "Component" }, { value: "uri", label: "Full URL" }]} />
        {dir === "decode" && <Checkbox label="Treat + as space" checked={plus} onChange={(e) => setPlus(e.target.checked)} />}
      </Toolbar>
      <TextTransform
        tool="url-encoder-decoder"
        input={input}
        setInput={setInput}
        output={output}
        error={error}
        inputLabel={dir === "encode" ? "Text to encode" : "Encoded text to decode"}
        outputLabel={dir === "encode" ? "Encoded output" : "Decoded output"}
        sample={dir === "encode" ? (mode === "uri" ? "https://example.com/search?q=café & crème" : "price < 100 & tag=café ☕") : "price%20%3C%20100%20%26%20tag%3Dcaf%C3%A9%20%E2%98%95"}
        placeholder={dir === "encode" ? "Type text or a URL…" : "Paste percent-encoded text…"}
        onSwap={() => {
          setInput(output);
          setDir(dir === "encode" ? "decode" : "encode");
        }}
      />
    </div>
  );
}
