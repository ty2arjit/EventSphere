import { describe, expect, it } from "vitest";
import { registerProfileSchema } from "./registerProfileSchema";

/**
 * These assert the schema mirrors the backend's `User.register()` rules.
 * Divergence here means the client either rejects input the server accepts
 * (false error) or accepts input the server rejects (surprise failure).
 */

describe("registerProfileSchema — valid input", () => {
  it("accepts a well-formed email and name", () => {
    const result = registerProfileSchema.safeParse({
      email: "user@example.com",
      name: "Test User",
    });

    expect(result.success).toBe(true);
  });

  it("normalises email to lowercase, matching backend behaviour", () => {
    const result = registerProfileSchema.safeParse({
      email: "User@Example.COM",
      name: "Test",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("user@example.com");
  });

  it("trims surrounding whitespace so a stray space is not a spurious error", () => {
    const result = registerProfileSchema.safeParse({
      email: "  user@example.com  ",
      name: "  Test User  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
      expect(result.data.name).toBe("Test User");
    }
  });
});

describe("registerProfileSchema — invalid email", () => {
  it.each([
    ["", "empty"],
    ["   ", "whitespace only"],
    ["not-an-email", "no @ or domain"],
    ["missing@domain", "no TLD"],
    ["@example.com", "no local part"],
    ["spaces in@example.com", "contains a space"],
  ])("rejects %j (%s)", (email) => {
    const result = registerProfileSchema.safeParse({ email, name: "Valid Name" });
    expect(result.success).toBe(false);
  });

  it("reports a user-facing message, not a raw schema error", () => {
    const result = registerProfileSchema.safeParse({ email: "bad", name: "Valid" });

    expect(result.success).toBe(false);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "";
      expect(message).toBe("Enter a valid email address.");
    }
  });
});

describe("registerProfileSchema — invalid name", () => {
  it.each([
    ["", "empty"],
    ["   ", "whitespace only — must fail after trim, as on the backend"],
  ])("rejects %j (%s)", (name) => {
    const result = registerProfileSchema.safeParse({ email: "user@example.com", name });
    expect(result.success).toBe(false);
  });

  it("reports a user-facing message for a missing name", () => {
    const result = registerProfileSchema.safeParse({ email: "user@example.com", name: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Name is required.");
    }
  });

  it("accepts a single character — the backend only requires non-empty", () => {
    const result = registerProfileSchema.safeParse({ email: "user@example.com", name: "A" });
    expect(result.success).toBe(true);
  });
});

describe("registerProfileSchema — missing fields", () => {
  it("rejects an object with no fields", () => {
    expect(registerProfileSchema.safeParse({}).success).toBe(false);
  });

  it("reports both fields when both are absent", () => {
    const result = registerProfileSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path[0]);
      expect(paths).toContain("email");
      expect(paths).toContain("name");
    }
  });
});
