import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileRegistrationForm } from "./ProfileRegistrationForm";
import * as profileClient from "../api/profileClient";
import type { ProfileResponse } from "../types";

/**
 * Closes TECHNICAL_BACKLOG.md BL-009 — this component previously had zero
 * tests.
 */

function fullResponse(overrides: Partial<ProfileResponse> = {}): ProfileResponse {
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

describe("ProfileRegistrationForm", () => {
  it("submits valid input and shows the success panel", async () => {
    const user = userEvent.setup();
    const registerSpy = vi
      .spyOn(profileClient, "registerProfile")
      .mockResolvedValue({ ok: true, data: fullResponse() });

    render(<ProfileRegistrationForm />);

    await user.type(screen.getByLabelText("Email"), "jane@example.com");
    await user.type(screen.getByLabelText("Name"), "Jane Doe");
    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() =>
      expect(registerSpy).toHaveBeenCalledWith({
        email: "jane@example.com",
        name: "Jane Doe",
      }),
    );
    expect(await screen.findByText("Profile registered")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("shows a validation error for an invalid email without calling the API", async () => {
    const user = userEvent.setup();
    const registerSpy = vi.spyOn(profileClient, "registerProfile");

    render(<ProfileRegistrationForm />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Name"), "Jane Doe");
    // Blur the email field so validation runs (mode: "onBlur").
    await user.click(screen.getByLabelText("Name"));
    await user.click(screen.getByRole("button", { name: /register/i }));

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it("shows the duplicate-email error message from the API", async () => {
    const user = userEvent.setup();
    vi.spyOn(profileClient, "registerProfile").mockResolvedValue({
      ok: false,
      error: {
        kind: "CONFLICT",
        code: "EMAIL_ALREADY_REGISTERED",
        message: "Email already registered: jane@example.com",
      },
    });

    render(<ProfileRegistrationForm />);

    await user.type(screen.getByLabelText("Email"), "jane@example.com");
    await user.type(screen.getByLabelText("Name"), "Jane Doe");
    await user.click(screen.getByRole("button", { name: /register/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That email is already registered.",
    );
  });
});
