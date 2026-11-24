import type { ToolContent } from "../types";

export const content: ToolContent = {
  intro: [
    "A cryptographic hash function turns any input into a fixed-length fingerprint. Change one bit of the input and the hash changes completely. Hashes are used to verify downloads, detect changes, build cache keys and sign data.",
    "This tool computes **SHA-256, SHA-384, SHA-512 and SHA-1** for text or files using your browser's built-in Web Crypto API. Files are read locally and never uploaded.",
  ],
  howTo: [
    "Choose **Text** and type or paste your input, or choose **File** and pick a file (up to 200 MB).",
    "All supported hashes are computed at once. Text is encoded as UTF-8 before hashing.",
    "Switch between hexadecimal and Base64 output and copy the value you need.",
    "To verify a download, paste the published checksum into **Compare** and look for a match.",
  ],
  examples: [
    { title: "SHA-256 of “abc”", input: "abc", output: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" },
    { title: "SHA-256 of an empty string", input: "", output: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" },
  ],
  sections: [
    {
      heading: "SHA-256 explained",
      paragraphs: [
        "SHA-256 is part of the SHA-2 family designed by the NSA and standardised by NIST (FIPS 180-4). It produces a 256-bit (64 hex character) digest and is used in TLS certificates, Git's newer object format, Bitcoin and software checksums. No practical collision attack is known.",
        "SHA-1 is **broken for collision resistance** (practical collisions were demonstrated in 2017). It's included only for compatibility with legacy checksums and should not be used for security.",
      ],
    },
    {
      heading: "Do not use these hashes for passwords",
      paragraphs: [
        "SHA-2 is designed to be fast, which makes it easy to brute-force. Store passwords with a dedicated, slow password-hashing algorithm such as **Argon2id**, **scrypt** or **bcrypt**, with a unique salt per password.",
      ],
    },
  ],
  faqs: [
    { q: "Why isn't MD5 available?", a: "The Web Crypto API doesn't implement MD5 because it is cryptographically broken. Use SHA-256 for new checksums." },
    { q: "Why does my hash differ from another tool's?", a: "Check for invisible differences: trailing newlines, Windows line endings (CRLF vs LF) or a different text encoding. This tool hashes your text exactly as entered, encoded as UTF-8." },
    { q: "Is hashing a file safe for confidential files?", a: "Yes. The file is read into your browser's memory and hashed locally; it is never uploaded." },
  ],
  privacy: "Text and files are hashed locally with the Web Crypto API. Nothing is uploaded, logged or stored.",
};
