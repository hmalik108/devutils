import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Analytics is optional and off by default. When enabled, only its script host
// is allowed; tool inputs are never sent anywhere (see lib/analytics.ts).
const analyticsOrigin = (() => {
  const src = process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT;
  if (!process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN || !src) return "";
  try {
    return new URL(src).origin;
  } catch {
    return "";
  }
})();

const csp = [
  "default-src 'self'",
  // Next.js injects inline bootstrap scripts into statically generated pages.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${analyticsOrigin}`.trim(),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self' ${analyticsOrigin}${isDev ? " ws:" : ""}`.trim(),
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    // The PRD lists /json-validator separately, but Tool 1 is a combined
    // "JSON Formatter & Validator". Keep the URL useful instead of a 404.
    return [{ source: "/json-validator", destination: "/json-formatter", permanent: true }];
  },
};

export default nextConfig;
