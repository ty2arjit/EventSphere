"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { CommunityList, BrowseCommunities } from "@/features/community";
import { FadeIn } from "@/components/motion/FadeIn";
import { useCurrentUser } from "@/features/authentication/hooks/useCurrentUser";

type Tab = "browse" | "mine";

export default function CommunitiesPage() {
  const { user, isLoading } = useCurrentUser();
  const [tab, setTab] = useState<Tab>("browse");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="size-5" />
            </span>
            <div>
              <h1 className="font-heading text-2xl font-semibold">Communities</h1>
              <p className="text-sm text-muted-foreground">
                Discover communities, or jump back into your own.
              </p>
            </div>
          </div>
          {user && (
            <Link
              href="/communities/new"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" />
              Create Community
            </Link>
          )}
        </div>
      </FadeIn>

      {!isLoading && user && (
        <div className="inline-flex rounded-full bg-secondary p-1">
          <button
            onClick={() => setTab("browse")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === "browse" ? "bg-card shadow-soft" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Browse All
          </button>
          <button
            onClick={() => setTab("mine")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === "mine" ? "bg-card shadow-soft" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            My Communities
          </button>
        </div>
      )}

      {tab === "mine" && user ? <CommunityList /> : <BrowseCommunities />}
    </div>
  );
}
