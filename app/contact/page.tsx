import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { InfoPage } from "@/components/layout/info-page";

export const metadata = pageMetadata({
  title: "Contact",
  description: "Contact devutils.info with bug reports, tool suggestions or questions.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <InfoPage title="Contact" path="/contact">
      <p>We&apos;d love to hear about bugs, confusing behavior or tools you&apos;d like to see.</p>
      <p>
        Email: <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>
      </p>
      <h2>Reporting a bug</h2>
      <ul>
        <li>Which tool and browser you were using.</li>
        <li>What you expected and what happened instead.</li>
        <li>
          A <strong>minimal, non-sensitive</strong> example input. Please never send real tokens, passwords, keys or personal data.
        </li>
      </ul>
    </InfoPage>
  );
}
