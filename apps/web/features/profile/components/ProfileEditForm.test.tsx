import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileEditForm } from "./ProfileEditForm";
import * as profileClient from "../api/profileClient";
import type { ProfileDetails, ProfileResponse } from "../types";

const emptyProfile: ProfileDetails = {
  avatarUrl: null,
  bio: null,
  headline: null,
  institution: null,
  department: null,
  graduationYear: null,
};

function fullResponse(overrides: Partial<ProfileResponse> = {}): ProfileResponse {
  return {
    id: "abc",
    email: "jane@example.com",
    name: "Jane Doe",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    status: "registered",
    verifiedAt: null,
    profile: { ...emptyProfile, bio: "Updated bio" },
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

describe("ProfileEditForm", () => {
  it("submits the edited bio and reports the updated profile", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const updateSpy = vi
      .spyOn(profileClient, "updateProfile")
      .mockResolvedValue({ ok: true, data: fullResponse() });

    render(
      <ProfileEditForm profileId="abc" initialValues={emptyProfile} onSuccess={onSuccess} />,
    );

    await user.type(screen.getByLabelText("Bio"), "Updated bio");
    await user.click(screen.getByRole("button", { name: /save profile/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(fullResponse()));
    expect(updateSpy).toHaveBeenCalledWith(
      "abc",
      expect.objectContaining({ bio: "Updated bio" }),
    );
    expect(await screen.findByText("Profile updated.")).toBeInTheDocument();
  });

  it("shows an error message when the update fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(profileClient, "updateProfile").mockResolvedValue({
      ok: false,
      error: { kind: "NOT_FOUND", code: "PROFILE_NOT_FOUND", message: "not found" },
    });

    render(
      <ProfileEditForm profileId="abc" initialValues={emptyProfile} onSuccess={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: /save profile/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't find what you were looking for.",
    );
  });
});
