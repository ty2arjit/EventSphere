import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PreferencesForm } from "./PreferencesForm";
import * as profileClient from "../api/profileClient";
import type { ProfilePreferences, ProfileResponse } from "../types";

const initialPreferences: ProfilePreferences = {
  language: "en",
  timezone: "UTC",
  theme: "system",
  notifyByEmail: true,
  notifyInApp: true,
};

function fullResponse(): ProfileResponse {
  return {
    id: "abc",
    email: "jane@example.com",
    name: "Jane Doe",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
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
    preferences: { ...initialPreferences, notifyInApp: false },
  };
}

describe("PreferencesForm", () => {
  it("toggles a notification checkbox and submits the change", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const updateSpy = vi
      .spyOn(profileClient, "updatePreferences")
      .mockResolvedValue({ ok: true, data: fullResponse() });

    render(
      <PreferencesForm profileId="abc" initialValues={initialPreferences} onSuccess={onSuccess} />,
    );

    await user.click(screen.getByRole("checkbox", { name: "In-app notifications" }));
    await user.click(screen.getByRole("button", { name: /save preferences/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(fullResponse()));
    expect(updateSpy).toHaveBeenCalledWith(
      "abc",
      expect.objectContaining({ notifyInApp: false }),
    );
  });

  it("shows an error message when the update fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(profileClient, "updatePreferences").mockResolvedValue({
      ok: false,
      error: { kind: "SERVER", code: "INTERNAL_ERROR", message: "boom" },
    });

    render(
      <PreferencesForm profileId="abc" initialValues={initialPreferences} onSuccess={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: /save preferences/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong on our end. Please try again in a moment.",
    );
  });
});
