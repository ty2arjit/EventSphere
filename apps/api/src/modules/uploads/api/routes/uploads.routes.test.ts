import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../../../app";
import { InMemoryProfileRepository } from "../../../profile/test-support/InMemoryProfileRepository";
import { RecordingEventPublisher } from "../../../profile/test-support/RecordingEventPublisher";
import { InMemoryUserCredentialRepository } from "../../../authentication/test-support/InMemoryUserCredentialRepository";
import {
  FakePasswordHasher,
  FakeTokenHasher,
  SequentialTokenGenerator,
  SequentialOtpGenerator,
  RecordingMailer,
  FakeJwtService,
  InMemoryProfileGateway,
} from "../../../authentication/test-support/fakes";
import { DEFAULT_AUTH_CONFIG } from "../../../authentication/application/AuthConfig";
import { CloudinarySignatureService } from "../../infrastructure/CloudinarySignatureService";

function buildApp(signatureService: CloudinarySignatureService | null) {
  const profileRepository = new InMemoryProfileRepository();
  const eventPublisher = new RecordingEventPublisher();
  const credentialRepository = new InMemoryUserCredentialRepository();
  const jwtService = new FakeJwtService();

  return createApp({
    profileRepository,
    eventPublisher,
    corsOrigins: ["http://localhost:3000"],
    jwtService,
    authDependencies: {
      credentialRepository,
      passwordHasher: new FakePasswordHasher(),
      tokenHasher: new FakeTokenHasher(),
      tokenGenerator: new SequentialTokenGenerator(),
      otpGenerator: new SequentialOtpGenerator(),
      jwtService,
      mailer: new RecordingMailer(),
      eventPublisher,
      authConfig: DEFAULT_AUTH_CONFIG,
      profileGateway: new InMemoryProfileGateway(),
    },
    uploadsDependencies: { signatureService },
  });
}

async function registerAndLogin(app: ReturnType<typeof buildApp>, email: string) {
  await request(app)
    .post("/api/v1/auth/register")
    .set("X-Requested-With", "XMLHttpRequest")
    .send({ email, name: "Test User", password: "correcthorse1battery" });
  const res = await request(app)
    .post("/api/v1/auth/login")
    .set("X-Requested-With", "XMLHttpRequest")
    .send({ email, password: "correcthorse1battery" });
  const cookies = res.headers["set-cookie"] as unknown as string[];
  return cookies.map((c) => c.split(";")[0]).join("; ");
}

describe("GET /api/v1/uploads/signature", () => {
  it("returns 503 when Cloudinary isn't configured", async () => {
    const app = buildApp(null);
    const cookie = await registerAndLogin(app, "uploader1@example.com");

    const res = await request(app)
      .get("/api/v1/uploads/signature?folder=avatars")
      .set("Cookie", cookie);

    expect(res.status).toBe(503);
    expect(res.body.error).toBe("UPLOADS_NOT_CONFIGURED");
  });

  it("returns 401 when not authenticated", async () => {
    const app = buildApp(new CloudinarySignatureService("demo", "key", "secret"));

    const res = await request(app).get("/api/v1/uploads/signature?folder=avatars");

    expect(res.status).toBe(401);
  });

  it("returns 400 for an unknown folder", async () => {
    const app = buildApp(new CloudinarySignatureService("demo", "key", "secret"));
    const cookie = await registerAndLogin(app, "uploader2@example.com");

    const res = await request(app)
      .get("/api/v1/uploads/signature?folder=not-a-real-folder")
      .set("Cookie", cookie);

    expect(res.status).toBe(400);
  });

  it("returns a signed payload for a valid folder when configured", async () => {
    const app = buildApp(new CloudinarySignatureService("demo-cloud", "demo-key", "demo-secret"));
    const cookie = await registerAndLogin(app, "uploader3@example.com");

    const res = await request(app)
      .get("/api/v1/uploads/signature?folder=logos")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ cloudName: "demo-cloud", apiKey: "demo-key", folder: "logos" });
    expect(typeof res.body.signature).toBe("string");
    expect(res.body.signature.length).toBeGreaterThan(0);
    expect(typeof res.body.timestamp).toBe("number");
  });
});
