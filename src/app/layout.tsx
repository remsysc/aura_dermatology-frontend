import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { config } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${config.clinic.name} | Doctor-led dermatology & laser`,
    template: `%s | ${config.clinic.name}`,
  },
  description:
    "Book doctor-led dermatology consultations and precision laser treatments. Real-time availability, transparent pricing and a confidential medical intake.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#faf8f5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col bg-alabaster text-ink antialiased">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-forest focus:px-4 focus:py-3 focus:text-alabaster"
        >
          Skip to main content
        </a>
        <SiteHeader />
        <div id="content" className="flex-1">
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
