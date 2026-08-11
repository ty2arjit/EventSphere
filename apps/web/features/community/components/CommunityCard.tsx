import Link from "next/link";
import Image from "next/image";
import { Users, ArrowUpRight } from "lucide-react";
import type { CommunityListItem } from "../types";

interface CommunityCardProps {
  community: CommunityListItem;
}

export function CommunityCard({ community }: CommunityCardProps) {
  const initial = community.name.trim().charAt(0).toUpperCase() || "C";

  return (
    <Link
      href={`/communities/${community.slug}`}
      className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-soft-lg"
    >
      {community.logoUrl ? (
        <span className="relative size-11 shrink-0 overflow-hidden rounded-xl">
          <Image src={community.logoUrl} alt="" fill unoptimized className="object-cover" />
        </span>
      ) : (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary font-heading text-lg font-medium text-primary-foreground">
          {initial}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-heading text-base font-medium">{community.name}</h3>
            <p className="truncate font-mono text-xs text-muted-foreground">@{community.slug}</p>
          </div>
          <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        {community.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {community.description}
          </p>
        )}
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5" />
          {community.memberCount} member{community.memberCount !== 1 ? "s" : ""}
        </div>
      </div>
    </Link>
  );
}
