import { encodeBase64, decodeBase64 } from "@/features/encoding/base64";
import { encodeUrl, decodeUrl } from "@/features/encoding/url";

describe("Base64", () => {
  it("encodes ASCII and Unicode", () => {
    expect(encodeBase64("hello")).toBe("aGVsbG8=");
    expect(encodeBase64("héllo 👋")).toBe("aMOpbGxvIPCfkYs=");
    expect(encodeBase64("??>", true)).toBe("Pz8-");
  });

  it("round-trips", () => {
    for (const s of ["", "a", "ab", "abc", "Grüße, 世界! 🚀", "line1\nline2\t"]) {
      const d = decodeBase64(encodeBase64(s) || "=");
      if (s === "") continue;
      expect(d).toEqual({ ok: true, value: s });
    }
  });

  it("accepts URL-safe, unpadded and whitespace-wrapped input", () => {
    expect(decodeBase64("Pz8-")).toEqual({ ok: true, value: "??>" });
    expect(decodeBase64("aGVs\nbG8")).toEqual({ ok: true, value: "hello" });
  });

  it("rejects invalid input clearly", () => {
    expect(decodeBase64("abc$")).toMatchObject({ ok: false, error: expect.stringMatching(/Invalid character "\$"/) });
    expect(decodeBase64("a")).toMatchObject({ ok: false, error: expect.stringMatching(/length/) });
    expect(decodeBase64("ab=c")).toMatchObject({ ok: false, error: expect.stringMatching(/Padding/) });
    expect(decodeBase64("/w==")).toMatchObject({ ok: false, error: expect.stringMatching(/UTF-8/) });
  });
});

describe("URL encoding", () => {
  it("encodes components with correct semantics", () => {
    expect(encodeUrl("a b&c=d/é")).toEqual({ ok: true, value: "a%20b%26c%3Dd%2F%C3%A9" });
    expect(encodeUrl("https://x.io/a b?q=é", "uri")).toEqual({ ok: true, value: "https://x.io/a%20b?q=%C3%A9" });
    expect(encodeUrl("\uD800").ok).toBe(false);
  });

  it("decodes and round-trips", () => {
    const s = "q=hello world&emoji=🎉";
    const e = encodeUrl(s);
    expect(e.ok && decodeUrl(e.value)).toEqual({ ok: true, value: s });
    expect(decodeUrl("a+b", { plusAsSpace: true })).toEqual({ ok: true, value: "a b" });
  });

  it("reports malformed input", () => {
    expect(decodeUrl("100%")).toMatchObject({ ok: false, error: expect.stringMatching(/position 4/) });
    expect(decodeUrl("%zz")).toMatchObject({ ok: false });
    expect(decodeUrl("%E0%A4")).toMatchObject({ ok: false, error: expect.stringMatching(/UTF-8/) });
  });
});
