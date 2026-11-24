import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { InfoPage } from "@/components/layout/info-page";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: "How devutils.info handles data: tool inputs are processed locally in your browser and never uploaded, logged or stored.",
  path: "/privacy-policy",
});

export default function PrivacyPage() {
  return (
    <InfoPage title="Privacy Policy" path="/privacy-policy" updated="November 23, 2026">
      <p>
        {siteConfig.name} is designed to collect as little information as possible. This policy explains what happens to data when you use the site.
      </p>
      <h2>Tool inputs and outputs</h2>
      <ul>
        <li>All tools process your input locally in your browser using JavaScript, the Web Crypto API and Web Workers.</li>
        <li>Your input and the results are <strong>not sent to our servers</strong> or to any third party.</li>
        <li>Inputs are not written to cookies, localStorage or other browser storage. Closing or reloading the page discards them.</li>
        <li>Inputs and outputs are never included in analytics or error reports.</li>
      </ul>
      <h2>Stored preferences</h2>
      <p>
        Your theme choice (light, dark or system) is saved in your browser&apos;s localStorage under the key <code>devutils-theme</code>. It never leaves your device.
      </p>
      <h2>Analytics</h2>
      <p>
        We may use privacy-friendly, cookie-less analytics to count page views and coarse events such as “a tool was used” or “output was copied”. These events contain the tool name only — never what you typed. No advertising or cross-site tracking identifiers are used.
      </p>
      <h2>Server logs</h2>
      <p>
        Our hosting provider may keep standard request logs (such as IP address, user agent and requested URL) for security and reliability. Because tools run locally, these logs do not contain tool inputs.
      </p>
      <h2>Accounts</h2>
      <p>There are no user accounts, so we hold no profile data about you.</p>
      <h2>Contact</h2>
      <p>
        Questions about privacy: <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
      </p>
    </InfoPage>
  );
}
