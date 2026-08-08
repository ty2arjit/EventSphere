import Link from "next/link";
import type { CommunityListItem } from "../types";

interface CommunityCardProps {
  community: CommunityListItem;
}

export function CommunityCard({ community }: CommunityCardProps) {
  return (
    <Link
      href={`/communities/${community.slug}`}
      className="block rounded-lg border p-4 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{community.name}</h3>
          {community.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {community.description}
            </p>
          )}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {community.memberCount} member{community.memberCount !== 1 ? "s" : ""}
        </span>
      </div>
    </Link>
  );
}
