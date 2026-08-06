import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfileView } from "./ProfileView";
import type { ProfileResponse } from "../types";

function buildProfile(overrides: Partial<ProfileResponse> = {}): ProfileResponse {
  return {
    id: "abc",
    email: "jane@example.com",
    name: "Jane Doe",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    status: "registered",
    verifiedAt: null,
    profile: {
      avatarUrl: null,
      bio: null,
      headline: null,
      institution: null,
      department: null,
      graduationYear: null,
    },
    preferences: {
      language: "en",
      timezone: "UTC",
      theme: "system",
      notifyByEmail: true,
      notifyInApp: true,
    },
    ...overrides,
  };
}

describe("ProfileView", () => {
  it("renders the name and email", () => {
    render(<ProfileView profile={buildProfile()} />);

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("shows initials when there is no avatar", () => {
    render(<ProfileView profile={buildProfile()} />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("renders bio/headline/institution when present", () => {
    render(
      <ProfileView
        profile={buildProfile({
          profile: {
            avatarUrl: null,
            bio: "Researcher.",
            headline: "PhD Candidate",
            institution: "Stanford University",
            department: null,
            graduationYear: 2026,
          },
        })}
      />,
    );

    expect(screen.getByText("PhD Candidate")).toBeInTheDocument();
    expect(screen.getByText("Researcher.")).toBeInTheDocument();
    expect(screen.getByText("Stanford University")).toBeInTheDocument();
    expect(screen.getByText("Class of 2026")).toBeInTheDocument();
  });

  it("reflects the profile's status", () => {
    render(<ProfileView profile={buildProfile({ status: "verified" })} />);
    expect(screen.getByText("Verified")).toBeInTheDocument();
  });
});
