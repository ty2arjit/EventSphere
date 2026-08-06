import { describe, expect, it } from "vitest";
import { updatePreferencesSchema } from "./updatePreferencesSchema";

describe("updatePreferencesSchema", () => {
  it("accepts a partial patch", () => {
    const result = updatePreferencesSchema.safeParse({ theme: "dark" });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object", () => {
    const result = updatePreferencesSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects an invalid theme", () => {
    const result = updatePreferencesSchema.safeParse({ theme: "neon" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty language", () => {
    const result = updatePreferencesSchema.safeParse({ language: "" });
    expect(result.success).toBe(false);
  });

  it("accepts boolean notification flags", () => {
    const result = updatePreferencesSchema.safeParse({
      notifyByEmail: false,
      notifyInApp: true,
    });
    expect(result.success).toBe(true);
  });
});
