import type { ToolContent } from "../types";

export const content: ToolContent = {
  intro: [
    "URLs may only contain a limited set of ASCII characters. Everything else — spaces, `&`, `?`, `#`, non-English letters, emoji — must be **percent-encoded** as `%` followed by two hex digits per UTF-8 byte.",
    "This tool encodes and decodes URL components using the same rules as JavaScript's `encodeURIComponent` and `decodeURIComponent`, with an option for whole-URL encoding (`encodeURI`).",
  ],
  howTo: [
    "Choose **Encode** or **Decode**.",
    "Pick **Component** mode for a single query value or path segment, or **Full URL** mode to keep `:/?#&=` intact.",
    "When decoding form submissions, enable **Treat + as space** (`application/x-www-form-urlencoded`).",
    "Copy the result.",
  ],
  examples: [
    { title: "Encode a query value", input: "price < 100 & category=books", output: "price%20%3C%20100%20%26%20category%3Dbooks" },
    { title: "Encode Unicode", input: "café ☕", output: "caf%C3%A9%20%E2%98%95" },
    { title: "Encode a full URL", description: "Full URL mode keeps reserved characters.", input: "https://example.com/search?q=hello world", output: "https://example.com/search?q=hello%20world" },
  ],
  sections: [
    {
      heading: "Component vs full URL encoding",
      paragraphs: [
        "`encodeURIComponent` escapes every reserved character (`; , / ? : @ & = + $ #`) so a value can't break the URL's structure — use it for individual parameters. `encodeURI` leaves those characters alone and is meant for an already-assembled URL. Encoding a whole URL in component mode turns `https://` into `https%3A%2F%2F`.",
      ],
    },
  ],
  faqs: [
    { q: "Why is a space encoded as %20 and not +?", a: "`%20` is the standard percent-encoding for a space in URLs. `+` means space only in HTML form encoding (`application/x-www-form-urlencoded`). Enable **Treat + as space** when decoding form data." },
    { q: "What does “Malformed escape” mean?", a: "A `%` must be followed by exactly two hexadecimal digits. Input like `100%` or `%zz` is not valid percent-encoding. Encode a literal percent sign as `%25`." },
    { q: "Why does decoding fail with a UTF-8 error?", a: "Multi-byte characters are encoded as several `%XX` groups. If some of them are missing (e.g. `%E2%98` without the final byte), the sequence isn't valid UTF-8." },
  ],
};
