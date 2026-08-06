import { describe, expect, it } from "vitest";
import { updateProfileSchema } from "./updateProfileSchema";

describe("updateProfileSchema", () => {
  it("accepts a partial patch", () => {
    const result = updateProfileSchema.safeParse({ bio: "Hello" });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object (no fields to change)", () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts null to clear a field", () => {
    const result = updateProfileSchema.safeParse({ bio: null });
    expect(result.success).toBe(true);
  });

  it("rejects a graduation year before 1950", () => {
    const result = updateProfileSchema.safeParse({ graduationYear: 1900 });
    expect(result.success).toBe(false);
  });

  it("rejects a graduation year far in the future", () => {
    const result = updateProfileSchema.safeParse({
      graduationYear: new Date().getFullYear() + 50,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a graduation year within range", () => {
    const result = updateProfileSchema.safeParse({ graduationYear: 2026 });
    expect(result.success).toBe(true);
  });

  it("treats NaN (an empty number input via RHF's valueAsNumber) as not provided", () => {
    const result = updateProfileSchema.safeParse({ graduationYear: NaN });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.graduationYear).toBeUndefined();
  });

  it("rejects a bio over 2000 characters", () => {
    const result = updateProfileSchema.safeParse({ bio: "a".repeat(2001) });
    expect(result.success).toBe(false);
  });
});
