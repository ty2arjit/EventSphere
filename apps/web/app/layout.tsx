import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
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

export const metadata: Metadata = {
  title: "EventSphere",
  description: "EventSphere — academic community events platform.",
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
