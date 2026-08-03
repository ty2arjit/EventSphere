import { describe, expect, it } from "vitest";
import { getErrorMessage } from "./errorMessages";
import type { ApiError } from "./types";

function error(partial: Partial<ApiError>): ApiError {
  return { kind: "UNKNOWN", code: "SOMETHING", message: "raw diagnostic", ...partial };
}

describe("getErrorMessage — code-specific copy", () => {
  it("prefers feature copy over the generic kind fallback", () => {
    const message = getErrorMessage(
      error({ kind: "CONFLICT", code: "EMAIL_ALREADY_REGISTERED" }),
      { EMAIL_ALREADY_REGISTERED: "That email is already registered." },
    );

    expect(message).toBe("That email is already registered.");
  });

  it("falls back to the kind message when the code has no specific copy", () => {
    const message = getErrorMessage(error({ kind: "CONFLICT", code: "SOME_OTHER_CONFLICT" }), {
      EMAIL_ALREADY_REGISTERED: "That email is already registered.",
    });

    expect(message).toBe("That entry already exists.");
  });
});

describe("getErrorMessage — kind fallbacks", () => {
  it.each([
    ["VALIDATION", "Please check the details you entered and try again."],
    ["CONFLICT", "That entry already exists."],
    ["NOT_FOUND", "We couldn't find what you were looking for."],
    ["UNAUTHORIZED", "You need to sign in to do that."],
    ["FORBIDDEN", "You don't have permission to do that."],
    ["SERVER", "Something went wrong on our end. Please try again in a moment."],
    ["NETWORK", "We couldn't reach the server. Check your connection and try again."],
    ["TIMEOUT", "That took too long to respond. Please try again."],
    ["UNKNOWN", "Something unexpected happened. Please try again."],
  ])("maps %s to its message", (kind, expected) => {
    expect(getErrorMessage(error({ kind: kind as ApiError["kind"] }))).toBe(expected);
  });

  it("always returns copy for an unrecognised code (convention 11.1)", () => {
    const message = getErrorMessage(error({ kind: "VALIDATION", code: "TOTALLY_NEW_CODE" }));

    expect(message).toBeTruthy();
    expect(message).toBe("Please check the details you entered and try again.");
  });
});

describe("getErrorMessage — convention 11.3", () => {
  it("never leaks the backend's raw diagnostic message", () => {
    const message = getErrorMessage(
      error({
        kind: "CONFLICT",
        code: "EMAIL_ALREADY_REGISTERED",
        message: "Email already registered: user@example.com",
      }),
      { EMAIL_ALREADY_REGISTERED: "That email is already registered." },
    );

    expect(message).not.toContain("user@example.com");
    expect(message).toBe("That email is already registered.");
  });

  it("does not leak raw detail on the fallback path either", () => {
    const message = getErrorMessage(
      error({ kind: "SERVER", code: "INTERNAL_ERROR", message: "constraint users_email_key" }),
    );

    expect(message).not.toContain("users_email_key");
  });
});

describe("getErrorMessage — validation layer parity (convention 11.1)", () => {
  it("handles a transport-layer validation code", () => {
    expect(getErrorMessage(error({ kind: "VALIDATION", code: "VALIDATION_ERROR" }))).toBeTruthy();
  });

  it("handles a domain-layer validation code", () => {
    expect(getErrorMessage(error({ kind: "VALIDATION", code: "INVALID_EMAIL" }))).toBeTruthy();
  });
});
