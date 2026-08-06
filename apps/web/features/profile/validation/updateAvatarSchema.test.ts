import { describe, expect, it } from "vitest";
import { updateAvatarSchema } from "./updateAvatarSchema";

describe("updateAvatarSchema", () => {
  it("accepts a well-formed http(s) URL", () => {
    const result = updateAvatarSchema.safeParse({ avatarUrl: "https://example.com/a.png" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.avatarUrl).toBe("https://example.com/a.png");
  });

  it("treats an empty string as null (no avatar)", () => {
    const result = updateAvatarSchema.safeParse({ avatarUrl: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.avatarUrl).toBeNull();
  });

  it("treats whitespace-only input as null", () => {
    const result = updateAvatarSchema.safeParse({ avatarUrl: "   " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.avatarUrl).toBeNull();
  });

  it("rejects a malformed URL", () => {
    const result = updateAvatarSchema.safeParse({ avatarUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("accepts an explicit null", () => {
    const result = updateAvatarSchema.safeParse({ avatarUrl: null });
    expect(result.success).toBe(true);
  });
});
