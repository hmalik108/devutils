import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE, defaultOgAlt } from "@/lib/og";

export const alt = defaultOgAlt;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    title: "Free developer tools that run in your browser",
    description: "JSON, JWT, regex, Base64, timestamps, cron, YAML and more. Your data never leaves your device.",
  });
}
