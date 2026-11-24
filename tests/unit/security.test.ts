import { decodeJwt, timeClaims, tokenStatus } from "@/features/security/jwt";
import { hashText, toHex } from "@/features/security/hash";
import { uuidv4, generateUuids, UUID_V4_RE, MAX_UUIDS } from "@/features/code/uuid";
import { encodeBase64 } from "@/features/encoding/base64";

const seg = (o: unknown) => encodeBase64(JSON.stringify(o), true);
const token = (payload: unknown, header: unknown = { alg: "HS256", typ: "JWT" }) => `${seg(header)}.${seg(payload)}.sig`;

describe("JWT decoder", () => {
  it("decodes header and payload", () => {
    const r = decodeJwt(token({ sub: "123", name: "Zoë" }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.header).toEqual({ alg: "HS256", typ: "JWT" });
      expect(r.value.payload).toEqual({ sub: "123", name: "Zoë" });
      expect(r.value.signature).toBe("sig");
    }
  });

  it("strips a Bearer prefix", () => {
    expect(decodeJwt(`Bearer ${token({ a: 1 })}`).ok).toBe(true);
  });

  it("gives understandable errors", () => {
    expect(decodeJwt("abc")).toMatchObject({ ok: false, error: expect.stringMatching(/3 dot-separated/) });
    expect(decodeJwt("a.b.c.d.e")).toMatchObject({ ok: false, error: expect.stringMatching(/JWE/) });
    expect(decodeJwt("!!!.e30.x")).toMatchObject({ ok: false, error: expect.stringMatching(/header/) });
    expect(decodeJwt(`${seg({ alg: "none" })}.bm90IGpzb24.`)).toMatchObject({ ok: false, error: expect.stringMatching(/payload is not valid JSON/) });
  });

  it("interprets expiry claims in seconds", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const exp = Date.UTC(2025, 11, 31) / 1000;
    const { claims } = timeClaims({ exp, iat: exp - 3600 });
    expect(claims.find((c) => c.claim === "exp")!.date.toISOString()).toBe("2025-12-31T00:00:00.000Z");
    expect(tokenStatus({ exp }, now).state).toBe("expired");
    expect(tokenStatus({ exp: exp + 2 * 86400 }, now).state).toBe("valid-time");
    expect(tokenStatus({ nbf: exp + 2 * 86400 }, now).state).toBe("not-yet-valid");
    expect(tokenStatus({}, now).state).toBe("no-expiry");
    expect(timeClaims({ exp: "soon" }).invalid).toHaveLength(1);
  });
});

describe("Hash generator", () => {
  it("computes SHA-256 / SHA-1 test vectors", async () => {
    expect(toHex(await hashText("SHA-256", "abc"))).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(toHex(await hashText("SHA-1", "abc"))).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
    expect(toHex(await hashText("SHA-256", ""))).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });
});

describe("UUID generator", () => {
  it("produces RFC-compliant v4 UUIDs", () => {
    for (let i = 0; i < 200; i++) expect(uuidv4()).toMatch(UUID_V4_RE);
  });

  it("uses the CSPRNG fallback correctly and never Math.random", () => {
    const spy = vi.spyOn(Math, "random");
    const orig = crypto.randomUUID;
    // Force the getRandomValues path.
    Object.defineProperty(crypto, "randomUUID", { value: undefined, configurable: true });
    try {
      for (let i = 0; i < 100; i++) expect(uuidv4()).toMatch(UUID_V4_RE);
    } finally {
      Object.defineProperty(crypto, "randomUUID", { value: orig, configurable: true });
    }
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("respects quantity limits and formatting", () => {
    expect(generateUuids(5)).toHaveLength(5);
    expect(new Set(generateUuids(500)).size).toBe(500);
    expect(generateUuids(10_000)).toHaveLength(MAX_UUIDS);
    expect(generateUuids(0)).toHaveLength(1);
    const [u] = generateUuids(1, { uppercase: true, hyphens: false, braces: true });
    expect(u).toMatch(/^\{[0-9A-F]{32}\}$/);
  });
});
