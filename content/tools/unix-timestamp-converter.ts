import type { ToolContent } from "../types";

export const content: ToolContent = {
  intro: [
    "A Unix timestamp (epoch time) counts the time since **1970-01-01 00:00:00 UTC**. Most systems use seconds (`1700000000`), while JavaScript, Java and many APIs use milliseconds (`1700000000000`). Mixing them up is one of the most common date bugs.",
    "This converter turns timestamps into UTC, your local time and ISO 8601 — and converts dates back to timestamps in both seconds and milliseconds.",
  ],
  howTo: [
    "Enter a timestamp. With **Auto** unit, values of 100 billion or more are treated as milliseconds; otherwise as seconds. Choose the unit explicitly to override.",
    "Click **Now** to fill in the current time.",
    "To go the other way, enter a date like `2026-11-23 14:30` and choose whether it's in your local time zone or UTC. Strings with an explicit offset (`Z`, `+02:00`) are always absolute.",
    "Copy any result with its copy button.",
  ],
  examples: [
    { title: "Seconds", input: "1700000000", output: "2023-11-14T22:13:20.000Z" },
    { title: "Milliseconds", input: "1700000000000", output: "2023-11-14T22:13:20.000Z" },
    { title: "Date to timestamp", input: "2026-11-23T14:30:00Z", output: "1795444200 (seconds) · 1795444200000 (ms)" },
  ],
  sections: [
    {
      heading: "Unix timestamps explained",
      paragraphs: [
        "Unix time ignores leap seconds and has no time zone: the same instant has the same timestamp everywhere. Time zones only matter when converting to a human-readable date.",
        "Signed 32-bit seconds overflow on **2038-01-19 03:14:07 UTC** (the “Year 2038 problem”). Modern 64-bit systems are unaffected.",
      ],
    },
    {
      heading: "Get the current timestamp in code",
      code: "JavaScript:  Math.floor(Date.now() / 1000)\nPython:      int(time.time())\nGo:          time.Now().Unix()\nBash:        date +%s\nPostgreSQL:  SELECT extract(epoch FROM now());",
    },
  ],
  faqs: [
    { q: "How do I know if a timestamp is in seconds or milliseconds?", a: "Count the digits. Current timestamps have 10 digits in seconds and 13 in milliseconds. The tool shows which unit it inferred and lets you override it." },
    { q: "Which time zone is “local”?", a: "The time zone your browser reports (shown next to the result). It's determined on your device; it isn't sent anywhere." },
    { q: "Are negative timestamps supported?", a: "Yes. Negative values represent dates before 1970, e.g. `-86400` is 1969-12-31T00:00:00Z." },
  ],
};
