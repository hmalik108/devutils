import type { ToolContent } from "../types";

export const content: ToolContent = {
  intro: [
    "Base64 represents binary data using 64 printable ASCII characters. It is used in data URIs, email attachments (MIME), HTTP Basic authentication headers, JSON Web Tokens and anywhere binary data must travel through a text-only channel.",
    "This tool encodes text to Base64 and decodes Base64 back to text. Text is converted to **UTF-8** first, so emoji and non-Latin scripts round-trip correctly — something the browser's built-in `btoa()` cannot do on its own.",
  ],
  howTo: [
    "Choose **Encode** or **Decode**.",
    "Type or paste your input. The result updates as you type.",
    "Enable **URL-safe** to use the base64url alphabet (`-` and `_` instead of `+` and `/`, no padding), as used in JWTs and URLs.",
    "Copy the output, or use **Swap** to feed the output back in as input.",
  ],
  examples: [
    { title: "Encode ASCII", input: "hello world", output: "aGVsbG8gd29ybGQ=" },
    { title: "Encode Unicode", input: "Grüße 👋", output: "R3LDvMOfZSDwn5GL" },
    { title: "Decode base64url", input: "eyJhbGciOiJIUzI1NiJ9", output: '{"alg":"HS256"}' },
  ],
  sections: [
    {
      heading: "Base64 explained",
      paragraphs: [
        "Base64 takes 3 bytes (24 bits) at a time and splits them into four 6-bit groups. Each group indexes into the alphabet `A–Z a–z 0–9 + /`. When the input isn't a multiple of 3 bytes, `=` padding fills the last block. That's why Base64 output is about 33% larger than the input.",
        "**Base64 is not encryption.** Anyone can decode it. Never use it to hide secrets.",
      ],
    },
  ],
  faqs: [
    { q: "Why do I get “Decoded data is not valid UTF-8 text”?", a: "The Base64 decodes to bytes that aren't text — for example an image, a ZIP file or encrypted data. This tool decodes to text only and won't show binary data as garbled characters." },
    { q: "What's the difference between Base64 and base64url?", a: "base64url (RFC 4648 §5) replaces `+` with `-` and `/` with `_`, and usually omits `=` padding, so the result is safe in URLs and file names. The decoder accepts both automatically." },
    { q: "Are line breaks allowed in Base64 input?", a: "Yes. Whitespace and line breaks (as in MIME-wrapped Base64) are ignored when decoding." },
    { q: "Is my data sent anywhere?", a: "No. Encoding and decoding use the browser's built-in `TextEncoder`, `btoa` and `atob` APIs. Nothing leaves your device." },
  ],
};
