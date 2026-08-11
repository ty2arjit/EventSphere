import type { Metadata } from "next";
import { Navbar } from "@/components/ui/Navbar";

export const metadata: Metadata = {
  title: "Privacy Policy | EventSphere",
  description: "What EventSphere collects, why, and how it's handled.",
};

const SECTIONS = [
  {
    heading: "What we collect",
    body: [
      "Account details: your name, email address, and a hashed password (Argon2 — we never store the password itself).",
      "Profile details you choose to add: bio, headline, institution, department, graduation year, and an avatar image.",
      "Content you create: communities, events, registrations, tasks, announcements, and certificates.",
      "Basic session data: short-lived authentication cookies that keep you signed in.",
    ],
  },
  {
    heading: "How it's used",
    body: [
      "To run the platform — authenticate you, show your communities and events, and enforce who can manage what.",
      "To send account emails — verification codes, password resets — via our email provider.",
      "To host images you upload (avatars, community logos, event banners) via our image hosting provider.",
    ],
  },
  {
    heading: "Third parties we use",
    body: [
      "Neon (PostgreSQL) — stores application data.",
      "Railway and Vercel — host the API and web app.",
      "Resend — delivers verification and password-reset emails.",
      "Cloudinary — hosts uploaded images.",
      "If enabled, Google Analytics — aggregate, anonymized usage statistics. Not active unless a measurement ID is configured.",
    ],
  },
  {
    heading: "What we don't do",
    body: [
      "We don't sell your data.",
      "We don't share your data with advertisers.",
      "We don't store payment information — EventSphere doesn't process payments.",
    ],
  },
  {
    heading: "Your controls",
    body: [
      "You can edit or remove your profile details at any time from your profile page.",
      "You can deactivate your account from your profile settings.",
      "For anything else, reach out to whoever administers your EventSphere deployment.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto max-w-2xl px-6 py-16">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Legal
          </span>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight">Privacy Policy</h1>
          <p className="mt-3 text-muted-foreground">
            This describes, plainly, what EventSphere collects and what happens to it. It applies to
            every community and event run on this platform.
          </p>

          <div className="mt-10 space-y-8">
            {SECTIONS.map(({ heading, body }) => (
              <div key={heading}>
                <h2 className="font-heading text-lg font-medium">{heading}</h2>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground leading-relaxed">
                  {body.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
