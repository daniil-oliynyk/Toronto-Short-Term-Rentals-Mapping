import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms of Use | Toronto STR Explorer",
  description: "Terms governing use of the Toronto STR Explorer.",
};

const sections: LegalSection[] = [
  {
    title: "Accepting these terms",
    paragraphs: [
      "These Terms of Use apply to the Toronto STR Explorer website. By accessing or using the site, you agree to these terms. If you do not agree, please do not use the site.",
      "The site is provided as a public information and exploration tool. It is not affiliated with Airbnb or the City of Toronto.",
    ],
  },
  {
    title: "Permitted use",
    paragraphs: [
      "You may use the site for personal, educational, journalistic, and research purposes. You must use it lawfully and in a way that does not interfere with the site or other visitors.",
      "You may not attempt to bypass security controls, disrupt the service, introduce malicious code, or use automated traffic that places an unreasonable load on the site.",
    ],
  },
  {
    title: "Data and accuracy",
    paragraphs: [
      "The explorer presents short-term rental registration information obtained from public data sources. Records may be incomplete, delayed, outdated, or contain errors.",
      "The site does not guarantee that any listing is currently active, compliant, available, or associated with a particular rental platform. Verify important information with the original public source.",
    ],
  },
  {
    title: "No professional advice",
    paragraphs: [
      "Content on this site is provided for general informational purposes only. It is not legal, regulatory, real estate, financial, or other professional advice.",
    ],
  },
  {
    title: "Availability and changes",
    paragraphs: [
      "The site may be changed, suspended, or discontinued at any time. Features, data sources, and these terms may also be updated. The date at the top of this page identifies the latest version.",
    ],
  },
  {
    title: "Limitation of liability",
    paragraphs: [
      "The site is provided on an as-is and as-available basis, without warranties of any kind. To the fullest extent permitted by law, the site owner is not liable for losses arising from use of, or reliance on, the site or its data.",
    ],
  },
];

export default function TermsOfUsePage() {
  return (
    <LegalPage
      eyebrow="Legal · Terms"
      introduction="These terms explain the rules for using Toronto STR Explorer, including appropriate use of the site and the limitations of its public registration data."
      sections={sections}
      title="Terms of Use"
    />
  );
}
