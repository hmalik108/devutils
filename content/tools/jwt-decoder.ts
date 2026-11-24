import type { ToolContent } from "../types";

export const content: ToolContent = {
  intro: [
    "A JSON Web Token (JWT, RFC 7519) is a compact token made of three base64url-encoded parts separated by dots: a **header**, a **payload** of claims and a **signature**. JWTs carry identity and authorization data in OAuth 2.0, OpenID Connect and many APIs.",
    "This decoder reveals the header and payload as readable JSON and translates time claims (`exp`, `iat`, `nbf`) into dates, so you can quickly see who a token is for and whether it has expired.",
  ],
  howTo: [
    "Paste a JWT into the input. A leading `Bearer ` prefix is removed automatically.",
    "Read the decoded header (algorithm and key ID) and payload (claims).",
    "Check the status banner for expiry. Time claims are shown in UTC and in your local time zone.",
    "Copy either decoded section as JSON.",
  ],
  examples: [
    {
      title: "Sample token",
      input: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsImlhdCI6MTUxNjIzOTAyMn0.<signature>",
      output: '{\n  "sub": "1234567890",\n  "name": "Ada Lovelace",\n  "iat": 1516239022\n}',
    },
  ],
  sections: [
    {
      heading: "JWT structure explained",
      bullets: [
        "**Header** — the signing algorithm (`alg`, e.g. HS256, RS256, ES256) and token type (`typ`), sometimes a key ID (`kid`).",
        "**Payload** — claims such as `sub` (subject), `iss` (issuer), `aud` (audience), `exp` (expiry), `iat` (issued at) and `nbf` (not before). Times are in seconds since the Unix epoch.",
        "**Signature** — computed over the header and payload with a secret or private key. Only the signature proves a token is genuine.",
      ],
    },
    {
      heading: "Decoding is not verification",
      paragraphs: [
        "Anyone can decode a JWT; the payload is only encoded, not encrypted. This tool **does not verify the signature**, so a decoded token may be forged or tampered with. Always verify tokens on your server with a trusted library and the correct key before relying on their claims.",
      ],
    },
  ],
  faqs: [
    { q: "Does this tool verify the token's signature?", a: "No. It decodes only. A token that decodes cleanly is not necessarily valid, unexpired on the server's clock, or issued by who it claims." },
    { q: "Is it safe to paste a production token here?", a: "Decoding happens entirely in your browser and the token is never sent to any server or stored. Still, treat live tokens as credentials: prefer expired or test tokens, and never share them in tickets or chats." },
    { q: "Why can't it decode my token with 5 parts?", a: "A 5-part token is a JWE — an encrypted JWT. Its payload can only be read with the decryption key." },
    { q: "Why is the expiry time different from what I expected?", a: "`exp` is in seconds since 1970-01-01 UTC. If a library wrote milliseconds instead, the date will appear tens of thousands of years in the future. Use the [Unix Timestamp Converter](/unix-timestamp-converter) to double-check." },
  ],
  privacy: "Tokens are decoded locally with JavaScript. They are never transmitted, logged or saved in browser storage.",
};
