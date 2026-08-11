import { describe, expect, it } from "vitest";
import { CloudinarySignatureService } from "./CloudinarySignatureService";

describe("CloudinarySignatureService.fromConnectionUrl", () => {
  it("parses a standard CLOUDINARY_URL into cloud name / key / secret", () => {
    const service = CloudinarySignatureService.fromConnectionUrl(
      "cloudinary://123456789012345:abcDEF-ghiJKL_mnoPQR@my-cloud-name",
    );

    const sig = service.sign("avatars");
    expect(sig.cloudName).toBe("my-cloud-name");
    expect(sig.apiKey).toBe("123456789012345");
    expect(sig.folder).toBe("avatars");
    expect(typeof sig.signature).toBe("string");
    expect(sig.signature.length).toBeGreaterThan(0);
  });

  it("tolerates surrounding whitespace (a common copy-paste artifact)", () => {
    const service = CloudinarySignatureService.fromConnectionUrl(
      "  cloudinary://key:secret@cloud  \n",
    );
    expect(service.sign("logos").cloudName).toBe("cloud");
  });

  it("throws a clear error for a malformed URL", () => {
    expect(() => CloudinarySignatureService.fromConnectionUrl("not-a-cloudinary-url")).toThrow(
      /Invalid CLOUDINARY_URL/,
    );
  });
});
