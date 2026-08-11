import { CalendarDays } from "lucide-react";
import { BrowseEvents } from "@/features/events";
import { FadeIn } from "@/components/motion/FadeIn";

export const metadata = {
  title: "Events | EventSphere",
  description: "Browse events happening across every community on EventSphere.",
};

export default function EventsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <FadeIn>
        <div className="flex items-center gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarDays className="size-5" />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-semibold">Events</h1>
            <p className="text-sm text-muted-foreground">
              Discover what&apos;s running across every community on EventSphere.
            </p>
          </div>
        </div>
      </FadeIn>

      <BrowseEvents />
    </div>
  );
}
