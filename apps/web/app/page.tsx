import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { PageTransition } from "@/components/motion/PageTransition";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <span className="text-lg font-bold text-primary">EventSphere</span>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <PageTransition>
          <div className="mx-auto max-w-2xl text-center space-y-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Your campus community,{" "}
              <span className="text-accent">connected</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              EventSphere brings academic communities together — manage events,
              coordinate teams, and build lasting connections.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Create your community
              </Link>
              <Link
                href="/communities"
                className="inline-flex h-11 items-center rounded-md border px-6 text-sm font-medium hover:bg-muted transition-colors"
              >
                Browse communities
              </Link>
              <Link
                href="/verify"
                className="inline-flex h-11 items-center rounded-md border px-6 text-sm font-medium hover:bg-muted transition-colors"
              >
                Verify certificate
              </Link>
            </div>
          </div>
        </PageTransition>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        EventSphere — Academic Community Events Platform
      </footer>
    </div>
  );
}
