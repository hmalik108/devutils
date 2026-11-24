import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { liveTools } from "@/lib/tools-registry";
import { InfoPage } from "@/components/layout/info-page";

export const metadata = pageMetadata({
  title: "About",
  description: "devutils.info is a free collection of fast, privacy-friendly developer utilities that run entirely in your browser.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <InfoPage title="About devutils.info" path="/about">
      <p>
        {siteConfig.name} is a small collection of focused developer utilities — {liveTools().length} today — built for the everyday tasks that interrupt real work: pretty-printing a JSON response, checking when a JWT expires, testing a regex,
        converting a timestamp from a log line.
      </p>
      <h2>Principles</h2>
      <ul>
        <li>
          <strong>Private by default.</strong> Tools run in your browser. Your input is not uploaded, logged or stored.
        </li>
        <li>
          <strong>Fast and focused.</strong> Each page loads only the code for its tool, with the tool at the top of the page.
        </li>
        <li>
          <strong>Free, no account.</strong> There is nothing to sign up for.
        </li>
        <li>
          <strong>Honest output.</strong> Tools explain their limits — for example, the JWT decoder never implies a token is verified, and the hash generator warns against using SHA-256 for passwords.
        </li>
      </ul>
      <h2>How it works</h2>
      <p>
        Processing uses standard browser features such as the Web Crypto API and Web Workers, plus well-known open-source libraries including CodeMirror, Prettier and the <code>yaml</code> package. There are no server-side APIs for tool processing.
      </p>
      <h2>Feedback</h2>
      <p>
        Found a bug or want a new tool? <Link href="/contact">Get in touch</Link>.
      </p>
    </InfoPage>
  );
}
