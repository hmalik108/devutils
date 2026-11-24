import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { InfoPage } from "@/components/layout/info-page";

export const metadata = pageMetadata({
  title: "Terms of Use",
  description: "Terms of use for devutils.info, a free collection of browser-based developer utilities provided as-is.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <InfoPage title="Terms of Use" path="/terms" updated="November 23, 2026">
      <p>By using {siteConfig.name} you agree to these terms.</p>
      <h2>Use of the tools</h2>
      <p>The tools are free for personal and commercial use. Don&apos;t attempt to disrupt the service or use it to break the law.</p>
      <h2>No warranty</h2>
      <p>
        The tools are provided <strong>“as is”</strong>, without warranties of any kind. Results may contain errors. Verify important output — especially for security-sensitive tasks — before relying on it. In particular:
      </p>
      <ul>
        <li>The JWT Decoder does not verify signatures. A decoded token is not proof of authenticity.</li>
        <li>Hashes produced by the Hash Generator are not suitable for password storage.</li>
        <li>Cron previews cannot guarantee when a job runs in your environment.</li>
      </ul>
      <h2>Limitation of liability</h2>
      <p>To the extent permitted by law, we are not liable for any damages arising from your use of the site or its output.</p>
      <h2>Open-source software</h2>
      <p>The site uses open-source libraries, each under its own license.</p>
      <h2>Changes</h2>
      <p>We may update these terms. Continued use after changes means you accept the updated terms.</p>
    </InfoPage>
  );
}
