import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-dot-grid p-6 text-center">
      <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_70%)] bg-mesh" />
      <div className="relative">
        <BrandMark className="mx-auto size-10" />
        <p className="mt-6 font-heading text-6xl font-semibold text-accent">404</p>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-3 max-w-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-soft transition-opacity hover:opacity-90"
          >
            Back to home
          </Link>
          <Link
            href="/events"
            className="group inline-flex h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-foreground transition-colors hover:text-accent"
          >
            Browse events
            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
