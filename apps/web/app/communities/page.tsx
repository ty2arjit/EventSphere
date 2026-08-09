import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { CommunityList } from "@/features/community";
import { FadeIn } from "@/components/motion/FadeIn";

export const metadata: Metadata = {
  title: "My Communities | EventSphere",
  description: "View and manage your communities.",
};

export default function CommunitiesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="size-5" />
            </span>
            <div>
              <h1 className="font-heading text-2xl font-semibold">My Communities</h1>
              <p className="text-sm text-muted-foreground">
                Every community you belong to, in one place.
              </p>
            </div>
          </div>
          <Link
            href="/communities/new"
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            Create Community
          </Link>
        </div>
      </FadeIn>

      <CommunityList />
    </div>
  );
}
