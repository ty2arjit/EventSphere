"use client";

import { useEffect, useState } from "react";

import { getErrorMessage } from "@/lib/api/errorMessages";
import { getProfile } from "../api/profileClient";
import type { ProfileResponse } from "../types";
import { AvatarField } from "./AvatarField";
import { PreferencesForm } from "./PreferencesForm";
import { ProfileEditForm } from "./ProfileEditForm";
import { ProfileView } from "./ProfileView";

/**
 * Client-side orchestrator for the `/profile/[id]` route. Fetches on mount
 * rather than in the Server Component shell — this mirrors the Walking
 * Skeleton's established convention of calling the Express API directly
 * from the browser rather than proxying through Next.js (see
 * `lib/api/config.ts`), so this stays consistent with how registration
 * already works.
 *
 * Holds the current profile in state and re-renders `ProfileView` after
 * each successful edit — each sub-form only knows how to submit its own
 * slice and report the resulting profile back up.
 */

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; profile: ProfileResponse }
  | { status: "error"; message: string };

export function ProfileDashboard({ profileId }: { profileId: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    getProfile(profileId, { signal: controller.signal }).then((result) => {
      if (result.ok) {
        setState({ status: "loaded", profile: result.data });
      } else {
        setState({ status: "error", message: getErrorMessage(result.error) });
      }
    });

    return () => controller.abort();
  }, [profileId]);

  if (state.status === "loading") {
    return <p className="text-sm text-muted-foreground">Loading profile…</p>;
  }

  if (state.status === "error") {
    return (
      <p role="alert" className="text-sm text-destructive">
        {state.message}
      </p>
    );
  }

  const { profile } = state;

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
      <ProfileView profile={profile} />

      <div className="space-y-6">
        <section className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground">Avatar</h2>
          <AvatarField
            profileId={profile.id}
            currentAvatarUrl={profile.profile.avatarUrl}
            onSuccess={(updated) => setState({ status: "loaded", profile: updated })}
          />
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground">Edit profile</h2>
          <ProfileEditForm
            profileId={profile.id}
            initialValues={profile.profile}
            onSuccess={(updated) => setState({ status: "loaded", profile: updated })}
          />
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground">Preferences</h2>
          <PreferencesForm
            profileId={profile.id}
            initialValues={profile.preferences}
            onSuccess={(updated) => setState({ status: "loaded", profile: updated })}
          />
        </section>
      </div>
    </div>
  );
}
