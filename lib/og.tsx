import { ImageResponse } from "next/og";
import { siteConfig } from "./site";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/**
 * Shared Open Graph image design (1200×630), rendered at build time with
 * next/og. Used for the site default and for every tool/category page.
 */
export function renderOgImage({ eyebrow, title, description }: { eyebrow?: string; title: string; description: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%)",
          color: "#f8fafc",
          fontFamily: "Geist",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              background: "#4f46e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 600 }}>
            devutils<span style={{ color: "#a5b4fc" }}>.info</span>
          </div>
        </div>

        {/* Title block */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {eyebrow && <div style={{ display: "flex", fontSize: 28, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: 2 }}>{eyebrow}</div>}
          <div style={{ display: "flex", fontSize: title.length > 32 ? 64 : 76, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1.5 }}>{title}</div>
          <div style={{ display: "flex", fontSize: 30, color: "#cbd5e1", lineHeight: 1.4, maxWidth: 1000 }}>{description}</div>
        </div>

        {/* Footer chips */}
        <div style={{ display: "flex", gap: 14 }}>
          {["Free", "No sign-up", "Runs in your browser"].map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                fontSize: 24,
                padding: "10px 22px",
                borderRadius: 999,
                border: "1px solid rgba(165,180,252,0.45)",
                background: "rgba(79,70,229,0.25)",
                color: "#e0e7ff",
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}

export const defaultOgAlt = `${siteConfig.name} — ${siteConfig.tagline}`;
