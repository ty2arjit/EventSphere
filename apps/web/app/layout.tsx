import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { SITE_URL } from "@/lib/siteUrl";
import "./globals.css";

// Self-hosted via next/font — inlined at build time, no runtime request to
// Google's CDN, so this doesn't reintroduce the "webfont download" cost the
// system-font stack was originally chosen to avoid. Used only for headings
// (--font-heading below); body text stays on the native system stack.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const DESCRIPTION =
  "EventSphere is where a campus community plans, staffs, and runs an event — committees, registration, attendance, and certificates, in one place.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "EventSphere — Academic Community Events Platform",
    template: "%s",
  },
  description: DESCRIPTION,
  openGraph: {
    title: "EventSphere — Academic Community Events Platform",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "EventSphere",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EventSphere — Academic Community Events Platform",
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <GoogleAnalytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
