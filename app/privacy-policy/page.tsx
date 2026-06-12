import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy practices for the Toronto STR Explorer.",
};

const sections: LegalSection[] = [
  {
    title: "Information we collect",
    paragraphs: [
      "You can browse Toronto STR Explorer without creating an account or directly providing personal information.",
      "When you use the site, basic technical information may be collected automatically, such as page views, browser type, device type, approximate location, and referring pages. This information is used in aggregate to understand site performance and usage.",
    ],
  },
  {
    title: "How information is used",
    paragraphs: [
      "Technical and usage information may be used to operate, secure, troubleshoot, and improve the site. It is not used to build advertising profiles or sell personal information.",
    ],
  },
  {
    title: "Public registration data",
    paragraphs: [
      "The site displays short-term rental registration information from public data sources. This information is presented to make public records easier to explore and is not collected directly from the individuals represented in those records.",
      "Questions or correction requests concerning the original records should be directed to the public body that maintains the source dataset.",
    ],
  },
  {
    title: "Analytics and service providers",
    paragraphs: [
      "The site may use privacy-conscious analytics and hosting providers to measure traffic, deliver content, and maintain reliability. These providers may process limited technical information under their own privacy terms.",
    ],
  },
  {
    title: "Data retention and security",
    paragraphs: [
      "Technical information is retained only as long as reasonably needed for site operations, security, and analysis. Reasonable safeguards are used, but no internet service can guarantee absolute security.",
    ],
  },
  {
    title: "Policy changes",
    paragraphs: [
      "This policy may be updated as the site or its services change. The latest revision date appears at the top of this page. Continued use of the site after an update means the revised policy applies.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal · Privacy"
      introduction="This policy describes what information Toronto STR Explorer may collect, why it is used, and how public short-term rental registration data is presented."
      sections={sections}
      title="Privacy Policy"
    />
  );
}
