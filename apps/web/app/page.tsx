import Link from "next/link";
import {
  CalendarDays,
  Users,
  ClipboardCheck,
  Megaphone,
  BarChart3,
  ShieldCheck,
  MapPin,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { PageTransition } from "@/components/motion/PageTransition";
import { FadeIn } from "@/components/motion/FadeIn";
import { StaggerList, StaggerItem } from "@/components/motion/StaggerList";

const FEATURES = [
  {
    icon: Users,
    title: "Communities",
    description:
      "Stand up a community in minutes — roles, positions, and membership handled for you.",
    span: true,
  },
  {
    icon: CalendarDays,
    title: "Event lifecycle",
    description:
      "Draft, publish, and run events with a real workflow — sessions, committees, status you can trust.",
  },
  {
    icon: ClipboardCheck,
    title: "Registration & attendance",
    description:
      "Open enrollment, approve participants, check them in, issue verifiable certificates.",
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
      "A dashboard of the numbers that matter — registrations, attendance, completion.",
  },
  {
    icon: ShieldCheck,
    title: "Real permissions",
    description:
      "Fine-grained authorization down to the resource — nobody sees a button they can't use.",
  },
];

const FAQS = [
  {
    question: "Is EventSphere free to use?",
    answer:
      "Yes. Creating a community, running events, taking registrations, and issuing certificates are all free.",
  },
  {
    question: "Who can create a community or event?",
    answer:
      "Anyone with an account can create a community. Only the community's owner, or someone they've explicitly granted a permission to, can manage its events.",
  },
  {
    question: "How does registration and approval work?",
    answer:
      "An organizer opens registration on an event with either automatic or manual approval. Participants enroll from the event page; approved enrollees can be checked in and issued a certificate.",
  },
  {
    question: "Are the certificates actually verifiable?",
    answer:
      "Yes — every issued certificate can be looked up on the public verification page using its certificate ID, no login required.",
  },
  {
    question: "Can I manage volunteers and tasks for an event?",
    answer:
      "Yes. Each event has a Kanban-style task board for coordinating your volunteer crew, plus an announcement feed to keep everyone posted.",
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
        <section className="relative border-b border-border/70">
          <div className="container mx-auto px-6 pt-16 pb-20 sm:pt-20 sm:pb-24">
            <PageTransition>
              <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-14 lg:gap-10 items-center">
                {/* Left: copy */}
                <div className="max-w-xl">
                  <FadeIn>
                    <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      <span className="h-px w-8 bg-accent" />
                      Event infrastructure for campus communities
                    </div>
                  </FadeIn>
                  <FadeIn delay={0.08}>
                    <h1 className="mt-6 text-balance text-5xl font-heading font-semibold tracking-tight sm:text-6xl leading-[1.05]">
                      Run the whole event.
                      <br />
                      Not just the poster.
                    </h1>
                  </FadeIn>
                  <FadeIn delay={0.16}>
                    <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                      EventSphere is where a campus community actually plans,
                      staffs, and runs an event — committees, registration,
                      attendance, and certificates, in one place instead of a
                      spreadsheet and six group chats.
                    </p>
                  </FadeIn>
                  <FadeIn delay={0.24}>
                    <div className="mt-8 flex flex-wrap items-center gap-3">
                      <Link
                        href="/register"
                        className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-soft transition-opacity hover:opacity-90"
                      >
                        Create your community
                      </Link>
                      <Link
                        href="/communities"
                        className="group inline-flex h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-foreground transition-colors hover:text-accent"
                      >
                        Browse communities
                        <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </Link>
                    </div>
                  </FadeIn>
                  <FadeIn delay={0.3}>
                    <dl className="mt-14 grid grid-cols-3 gap-6 border-t border-border/70 pt-6 max-w-md">
                      <div>
                        <dt className="text-2xl font-heading font-semibold">10</dt>
                        <dd className="text-xs text-muted-foreground mt-0.5">Bounded domains</dd>
                      </div>
                      <div>
                        <dt className="text-2xl font-heading font-semibold">90+</dt>
                        <dd className="text-xs text-muted-foreground mt-0.5">API endpoints</dd>
                      </div>
                      <div>
                        <dt className="text-2xl font-heading font-semibold">1</dt>
                        <dd className="text-xs text-muted-foreground mt-0.5">Source of truth</dd>
                      </div>
                    </dl>
                  </FadeIn>
                </div>

                {/* Right: product mock */}
                <FadeIn delay={0.2}>
                  <div className="relative mx-auto max-w-sm lg:max-w-none">
                    <div className="absolute -inset-6 -z-10 bg-dot-grid rounded-3xl [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_75%)]" />
                    <div className="rounded-2xl border border-border bg-card shadow-soft-lg overflow-hidden -rotate-1">
                      <div className="flex items-center justify-between border-b border-border/70 px-5 py-3.5">
                        <span className="text-xs font-medium text-muted-foreground">
                          Computer Science Society
                        </span>
                        <span className="inline-flex items-center rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-medium text-accent">
                          Registration open
                        </span>
                      </div>
                      <div className="p-5">
                        <h3 className="font-heading text-xl font-semibold">
                          Systems Design Sprint
                        </h3>
                        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="size-3.5" />
                            Sat, Sep 12 · 10:00 AM
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="size-3.5" />
                            Block C, Auditorium
                          </div>
                        </div>
                        <div className="mt-5 flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {["#1e2350", "#c9852c", "#7c7263"].map((c) => (
                              <span
                                key={c}
                                className="size-7 rounded-full border-2 border-card"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            128 enrolled
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 ml-8 rounded-2xl border border-border bg-card shadow-soft overflow-hidden rotate-1 p-4 flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <ClipboardCheck className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Attendance checked in</p>
                        <p className="text-xs text-muted-foreground">Certificate issued automatically</p>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              </div>
            </PageTransition>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-6 py-20 sm:py-24">
          <FadeIn>
            <div className="max-w-xl mb-14">
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                What's inside
              </span>
              <h2 className="mt-3 text-3xl font-heading font-semibold tracking-tight sm:text-4xl">
                Everything an organizer actually needs
              </h2>
            </div>
          </FadeIn>
          <StaggerList className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
            {FEATURES.map(({ icon: Icon, title, description, span }) => (
              <StaggerItem
                key={title}
                className={span ? "lg:col-span-2 lg:row-span-2" : undefined}
              >
                <div
                  className={`group h-full rounded-xl border border-border bg-card p-6 transition-colors hover:border-accent/40 ${
                    span ? "flex flex-col justify-between min-h-[220px]" : ""
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Icon className="size-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">
                      {title}
                    </span>
                  </div>
                  <p
                    className={`text-sm text-muted-foreground leading-relaxed ${
                      span ? "mt-4 text-base text-foreground max-w-sm" : "mt-3"
                    }`}
                  >
                    {description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </section>

        {/* How it works */}
        <section className="border-t border-border/70">
          <div className="container mx-auto px-6 py-20 sm:py-24">
            <FadeIn>
              <div className="max-w-xl mb-16">
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Process
                </span>
                <h2 className="mt-3 text-3xl font-heading font-semibold tracking-tight sm:text-4xl">
                  Three steps from idea to a running event
                </h2>
              </div>
            </FadeIn>
            <div className="relative mx-auto max-w-3xl">
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border sm:left-1/2" />
              <div className="space-y-10">
                {STEPS.map(({ step, title, description }, i) => (
                  <FadeIn key={step} delay={i * 0.1}>
                    <div
                      className={`relative flex items-start gap-5 sm:w-1/2 ${
                        i % 2 === 1 ? "sm:ml-auto sm:flex-row-reverse sm:text-right" : ""
                      }`}
                    >
                      <span
                        className={`flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card font-heading text-sm font-semibold sm:absolute sm:top-0 sm:size-9 ${
                          i % 2 === 1
                            ? "sm:right-0 sm:translate-x-1/2"
                            : "sm:left-0 sm:-translate-x-1/2"
                        }`}
                      >
                        {step}
                      </span>
                      <div
                        className={i % 2 === 1 ? "sm:pr-14" : "sm:pl-14"}
                      >
                        <h3 className="font-heading text-lg font-medium">{title}</h3>
                        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                          {description}
                        </p>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border/70">
          <div className="container mx-auto px-6 py-20 sm:py-24">
            <FadeIn>
              <div className="max-w-xl mb-10">
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  FAQ
                </span>
                <h2 className="mt-3 text-3xl font-heading font-semibold tracking-tight sm:text-4xl">
                  Questions organizers actually ask
                </h2>
              </div>
            </FadeIn>
            <div className="mx-auto max-w-2xl divide-y divide-border border-t border-b border-border">
              {FAQS.map(({ question, answer }, i) => (
                <FadeIn key={question} delay={i * 0.05}>
                  <details className="group py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-heading text-base font-medium marker:content-none">
                      {question}
                      <span className="shrink-0 text-xl leading-none text-muted-foreground transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{answer}</p>
                  </details>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-6 py-20 sm:pt-24 sm:pb-32 pb-24">
          <FadeIn>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 rounded-2xl border border-border bg-secondary/40 px-8 py-10 sm:px-12 sm:py-12">
              <div className="max-w-md">
                <h2 className="text-balance font-heading text-2xl font-semibold sm:text-3xl">
                  Bring your community online today
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Free to start. Set up your first event in minutes.
                </p>
              </div>
              <Link
                href="/register"
                className="inline-flex h-11 shrink-0 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-soft transition-opacity hover:opacity-90"
              >
                Get started
              </Link>
            </div>
          </FadeIn>
        </section>
      </main>

      <footer className="border-t border-border/70">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground">
          <span>EventSphere — Academic Community Events Platform</span>
          <div className="flex items-center gap-5">
            <Link href="/communities" className="hover:text-foreground transition-colors">
              Communities
            </Link>
            <Link href="/events" className="hover:text-foreground transition-colors">
              Events
            </Link>
            <Link href="/verify" className="hover:text-foreground transition-colors">
              Verify Certificate
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </footer>

      {/* Sticky mobile CTA — the primary hero CTA scrolls out of view fast on a
          phone; this keeps "Create your community" reachable without hunting
          back up the page. Desktop already has the CTA band + navbar. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 shadow-soft-lg backdrop-blur-md sm:hidden">
        <Link
          href="/register"
          className="flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground shadow-soft"
        >
          Create your community
        </Link>
      </div>
    </div>
  );
}
