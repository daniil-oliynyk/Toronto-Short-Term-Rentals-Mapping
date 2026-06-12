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
  title: {
    default: "Toronto STR Explorer",
    template: "%s | Toronto STR Explorer",
  },
  description:
    "Explore Toronto short-term rental registrations by address, property type, and ward.",
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
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
        <footer className="site-footer fixed inset-x-0 bottom-0 z-50 border-t border-white/8 bg-[#151512]/88 px-4 py-2 text-[#f4f1e8] shadow-[0_-14px_40px_rgb(16_15_11/28%)] backdrop-blur-xl">
          <nav
            aria-label="Footer navigation"
            className="mx-auto flex max-w-[1480px] items-center justify-between gap-4"
          >
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.18em] text-[#858176] sm:block">
              Toronto Short Term Rental Registrations
            </span>
            <div className="flex items-center gap-1 sm:gap-4">
              <a
                className="footer-link"
                href="https://www.daniiloliynyk.dev"
              >
                Contact
              </a>
              <Link className="footer-link" href="/terms-of-use">
                Terms
              </Link>
              <Link className="footer-link" href="/privacy-policy">
                Privacy
              </Link>
            </div>
          </nav>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
