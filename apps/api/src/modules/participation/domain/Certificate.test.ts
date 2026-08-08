import { describe, it, expect } from "vitest";
import { Certificate } from "./Certificate";

describe("Certificate", () => {
  function makeCert() {
    return Certificate.create("enroll-1", "event-1", "user-1");
  }

  it("creates with Pending status and verification code", () => {
    const c = makeCert();
    expect(c.status).toBe("Pending");
    expect(c.verificationCode).toHaveLength(12);
    expect(c.issuedAt).toBeNull();
  });

  it("issues a pending certificate", () => {
    const c = makeCert();
    c.issue();
    expect(c.status).toBe("Issued");
    expect(c.issuedAt).toBeTruthy();
  });

  it("rejects issuing non-pending", () => {
    const c = makeCert();
    c.issue();
    expect(() => c.issue()).toThrow("Cannot issue");
  });

  it("revokes an issued certificate", () => {
    const c = makeCert();
    c.issue();
    c.revoke("Academic misconduct");
    expect(c.status).toBe("Revoked");
    expect(c.revokedReason).toBe("Academic misconduct");
  });

  it("rejects revoking non-issued", () => {
    const c = makeCert();
    expect(() => c.revoke("reason")).toThrow("Cannot revoke");
  });

  it("sets template on pending", () => {
    const c = makeCert();
    c.setTemplate("template-1");
    expect(c.templateId).toBe("template-1");
  });

  it("rejects template change after issuance", () => {
    const c = makeCert();
    c.issue();
    expect(() => c.setTemplate("t")).toThrow("Cannot change template");
  });
});
