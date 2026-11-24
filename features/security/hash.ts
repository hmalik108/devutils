export type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";
export const HASH_ALGORITHMS: HashAlgorithm[] = ["SHA-256", "SHA-384", "SHA-512", "SHA-1"];

export function toHex(buf: ArrayBuffer, upper = false): string {
  const hex = Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
  return upper ? hex.toUpperCase() : hex;
}

export function toBase64(buf: ArrayBuffer): string {
  let s = "";
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s);
}

/** Hash bytes with the Web Crypto API (SubtleCrypto.digest). */
export async function digest(algorithm: HashAlgorithm, data: BufferSource): Promise<ArrayBuffer> {
  if (!globalThis.crypto?.subtle) throw new Error("Web Crypto is unavailable. It requires a secure (HTTPS) context.");
  return crypto.subtle.digest(algorithm, data);
}

export async function hashText(algorithm: HashAlgorithm, text: string): Promise<ArrayBuffer> {
  return digest(algorithm, new TextEncoder().encode(text));
}
