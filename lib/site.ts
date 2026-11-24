export const siteConfig = {
  name: "devutils.info",
  tagline: "Your everyday developer toolbox.",
  description:
    "Free, fast and privacy-friendly developer utilities that run in your browser: JSON, Base64, JWT, regex, timestamps, cron, YAML and more. No sign-up.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://devutils.info").replace(/\/$/, ""),
  contactEmail: "hello@devutils.info",
} as const;

export function absoluteUrl(path = "/"): string {
  return `${siteConfig.url}${path === "/" ? "" : path}`;
}
