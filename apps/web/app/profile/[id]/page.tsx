import type { Metadata } from "next";
// Imported through the feature's public interface, never from its internals.
import { ProfileDashboard } from "@/features/profile";

/**
 * `/profile/[id]` — view and edit a registered profile.
 *
 * A SERVER Component shell that only resolves the dynamic route segment;
 * all data fetching and interactivity live in `ProfileDashboard`
 * (`'use client'`), consistent with the Walking Skeleton's established
 * pattern of calling the Express API directly from the browser rather than
 * proxying through Next.js. Kept as its own route rather than folded into
 * `/profile` — registration (create) and viewing/editing are different
 * concerns.
 */

export const metadata: Metadata = {
  title: "Profile | EventSphere",
};

export default async function ProfileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto min-h-screen max-w-4xl p-6">
      <ProfileDashboard profileId={id} />
    </main>
  );
}
