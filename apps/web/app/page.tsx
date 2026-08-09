import Link from "next/link";
import {
  CalendarDays,
  Users,
  ClipboardCheck,
  Megaphone,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { BrandMark } from "@/components/ui/BrandMark";
import { PageTransition } from "@/components/motion/PageTransition";
import { FadeIn } from "@/components/motion/FadeIn";
import { StaggerList, StaggerItem } from "@/components/motion/StaggerList";

const FEATURES = [
  {
    icon: Users,
    title: "Communities",
    description:
      "Stand up a community in minutes — roles, positions, and membership handled for you.",
  },
  {
    icon: CalendarDays,
    title: "Event lifecycle",
    description:
      "Draft, publish, and run events with a real workflow — sessions, committees, and status you can trust.",
  },
  {
    icon: ClipboardCheck,
    title: "Registration & attendance",
    description:
      "Open enrollment, approve participants, check them in, and issue verifiable certificates.",
  },
  {
    icon: Megaphone,
    title: "Tasks & announcements",
    description:
      "Coordinate your volunteer crew with a Kanban board and keep everyone posted in one feed.",
  },
  {
    icon: BarChart3,
    title: "Live analytics",
    description:
      "A dashboard of the numbers that matter — registrations, attendance, and completion at a glance.",
  },
  {
    icon: ShieldCheck,
    title: "Real permissions",
    description:
      "Fine-grained authorization down to the resource — nobody sees a button they can't actually use.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Create your community",
    description: "Set it up once, then invite the people who'll run it with you.",
  },
  {
    step: "02",
    title: "Plan the event",
    description: "Sessions, committee, registration rules — configured, not improvised.",
  },
  {
    step: "03",
    title: "Run it live",
    description: "Enroll, check in, announce, and track — all from the same place.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-mesh">
          <div className="container mx-auto px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
            <PageTransition>
              <div className="mx-auto max-w-3xl text-center space-y-8">
                <FadeIn>
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
                    <BrandMark className="size-4" />
                    Built for academic communities
                  </div>
                </FadeIn>
                <FadeIn delay={0.08}>
                  <h1 className="text-balance text-5xl font-heading font-semibold tracking-tight sm:text-6xl">
                    Your campus community,{" "}
                    <span className="text-accent">connected</span>
                  </h1>
                </FadeIn>
                <FadeIn delay={0.16}>
                  <p className="text-balance text-lg text-muted-foreground max-w-xl mx-auto">
                    EventSphere brings academic communities together — plan
                    events, run committees, manage registration, and keep
                    everyone in the loop, end to end.
                  </p>
                </FadeIn>
                <FadeIn delay={0.24}>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <Link
                      href="/register"
                      className="inline-flex h-12 items-center rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground shadow-soft-lg transition-opacity hover:opacity-90"
                    >
                      Create your community
                    </Link>
                    <Link
                      href="/communities"
                      className="inline-flex h-12 items-center rounded-full border border-border bg-card px-7 text-sm font-medium shadow-soft transition-colors hover:bg-muted"
                    >
                      Browse communities
                    </Link>
                    <Link
                      href="/verify"
                      className="inline-flex h-12 items-center px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Verify a certificate →
                    </Link>
                  </div>
                </FadeIn>
              </div>
            </PageTransition>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-6 py-20 sm:py-24">
          <FadeIn>
            <div className="mx-auto max-w-2xl text-center space-y-3 mb-14">
              <h2 className="text-3xl font-heading font-semibold tracking-tight sm:text-4xl">
                Everything an organizer actually needs
              </h2>
              <p className="text-muted-foreground">
                Ten connected domains, one platform — no spreadsheets, no
                stitching tools together.
              </p>
            </div>
          </FadeIn>
          <StaggerList className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <StaggerItem key={title}>
                <div className="group h-full rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-soft-lg">
                  <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-heading text-lg font-medium mb-1.5">
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </section>

        {/* How it works */}
        <section className="border-t border-border/70 bg-secondary/40">
          <div className="container mx-auto px-6 py-20 sm:py-24">
            <FadeIn>
              <div className="mx-auto max-w-2xl text-center space-y-3 mb-14">
                <h2 className="text-3xl font-heading font-semibold tracking-tight sm:text-4xl">
                  How it works
                </h2>
                <p className="text-muted-foreground">
                  Three steps from idea to a running event.
                </p>
              </div>
            </FadeIn>
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
              {STEPS.map(({ step, title, description }, i) => (
                <FadeIn key={step} delay={i * 0.1}>
                  <div className="text-center sm:text-left">
                    <span className="font-heading text-4xl font-semibold text-accent/70">
                      {step}
                    </span>
                    <h3 className="mt-3 font-heading text-lg font-medium">
                      {title}
                    </h3>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                      {description}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-6 py-20 sm:py-24">
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center shadow-soft-lg sm:py-20">
              <div className="absolute inset-0 bg-mesh opacity-40" />
              <div className="relative space-y-6">
                <h2 className="text-balance font-heading text-3xl font-semibold text-primary-foreground sm:text-4xl">
                  Bring your community online today
                </h2>
                <p className="text-balance text-primary-foreground/80 max-w-lg mx-auto">
                  Free to start. Set up your first event in minutes.
                </p>
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center rounded-full bg-accent px-7 text-sm font-medium text-accent-foreground shadow-soft transition-opacity hover:opacity-90"
                >
                  Get started
                </Link>
              </div>
            </div>
          </FadeIn>
        </section>
      </main>

      <footer className="border-t border-border/70">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BrandMark className="size-5" />
            <span>EventSphere — Academic Community Events Platform</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/communities" className="hover:text-foreground transition-colors">
              Communities
            </Link>
            <Link href="/verify" className="hover:text-foreground transition-colors">
              Verify Certificate
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
