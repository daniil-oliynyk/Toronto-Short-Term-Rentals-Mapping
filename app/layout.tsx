import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Toronto STR Explorer",
  description: "Map Toronto short-term rental registrations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <footer className="fixed inset-x-0 bottom-0 z-50 border-t border-[#3a3a3d] bg-[#141414]/95 px-4 py-1.5 text-[#f1f1f2] shadow-[0_-8px_24px_rgb(0_0_0/28%)] backdrop-blur">
          <nav
            aria-label="Footer navigation"
            className="flex items-center justify-start gap-2 sm:gap-6"
          >
            <a
              className="cursor-pointer rounded-sm px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#96969c] underline-offset-4 transition hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f8f95]"
              href="https://www.daniiloliynyk.dev"
            >
              Contact
            </a>
            <Link
              className="cursor-pointer rounded-sm px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#96969c] underline-offset-4 transition hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f8f95]"
              href="/terms-of-use"
            >
              Terms of Use
            </Link>
            <Link
              className="cursor-pointer rounded-sm px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#96969c] underline-offset-4 transition hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f8f95]"
              href="/privacy-policy"
            >
              Privacy Policy
            </Link>
          </nav>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
