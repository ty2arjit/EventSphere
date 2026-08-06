import type { ProfileResponse } from "../types";

/**
 * Read-only display of a full profile. Presentation only — no business
 * logic, no API calls (Constitution Article 29).
 */

const STATUS_COPY: Readonly<Record<ProfileResponse["status"], string>> = {
  registered: "Registered",
  verified: "Verified",
  active: "Active",
  inactive: "Inactive",
  archived: "Archived",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function ProfileView({ profile }: { profile: ProfileResponse }) {
  const { avatarUrl, bio, headline, institution, department, graduationYear } = profile.profile;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="h-16 bg-gradient-to-br from-primary to-[color-mix(in_oklch,var(--primary),black_20%)]" />
      <div className="px-5 pb-5">
        <div className="-mt-7 flex items-end justify-between">
          <div className="flex size-14 items-center justify-center rounded-full border-4 border-card bg-accent text-lg font-semibold text-accent-foreground">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- avatar is a user-supplied URL, not a static asset
              <img
                src={avatarUrl}
                alt=""
                className="size-full rounded-full object-cover"
              />
            ) : (
              initials(profile.name)
            )}
          </div>
          <span className="mb-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {STATUS_COPY[profile.status]}
          </span>
        </div>

        <h2 className="mt-3 text-lg font-semibold text-card-foreground">{profile.name}</h2>
        {headline ? <p className="text-sm font-medium text-accent">{headline}</p> : null}
        {bio ? <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{bio}</p> : null}

        {institution || department || graduationYear ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {institution ? (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                {institution}
              </span>
            ) : null}
            {department ? (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                {department}
              </span>
            ) : null}
            {graduationYear ? (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                Class of {graduationYear}
              </span>
            ) : null}
          </div>
        ) : null}

        <dl className="mt-4 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
          <div className="flex justify-between gap-2">
            <dt>Email</dt>
            <dd className="text-card-foreground">{profile.email}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Member since</dt>
            <dd className="text-card-foreground">
              {new Date(profile.createdAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
