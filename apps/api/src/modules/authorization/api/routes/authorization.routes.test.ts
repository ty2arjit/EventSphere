import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../../../app";
import { InMemoryProfileRepository } from "../../../profile/test-support/InMemoryProfileRepository";
import { RecordingEventPublisher } from "../../../profile/test-support/RecordingEventPublisher";
import { InMemoryCommunityRepository } from "../../../community/test-support/InMemoryCommunityRepository";
import { InMemoryEventRepository } from "../../../event-management/test-support/InMemoryEventRepository";
import { InMemoryUserCredentialRepository } from "../../../authentication/test-support/InMemoryUserCredentialRepository";
import { InMemoryPermissionPolicyRepository } from "../../test-support/InMemoryPermissionPolicyRepository";
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
import { AuthorizeResourceActionService } from "../../application/AuthorizeResourceActionService";

/**
 * Regression coverage for a real gap: POST /grants and DELETE /grants/:id
 * had `requireAuth` but nothing checking whether the caller was actually
 * allowed to manage grants in the target community — any logged-in user
 * could grant themselves any permission at any context level. Fixed by
 * gating both routes on authorization:manage in the resolved community
 * (the community-owner fast path in AuthorizeResourceActionService covers
 * the common case without needing a pre-existing grant).
 */
function buildApp() {
  const profileRepository = new InMemoryProfileRepository();
  const eventPublisher = new RecordingEventPublisher();
  const communityRepository = new InMemoryCommunityRepository();
  const eventRepository = new InMemoryEventRepository();
  const credentialRepository = new InMemoryUserCredentialRepository();
  const permissionPolicyRepository = new InMemoryPermissionPolicyRepository();
  const jwtService = new FakeJwtService();
  const authorizeResourceActionService = new AuthorizeResourceActionService(
    permissionPolicyRepository,
    communityRepository,
  );

  const app = createApp({
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
    communityDependencies: { communityRepository, eventPublisher },
    authorizationDependencies: {
      permissionPolicyRepository,
      eventRepository,
      authorizeResourceActionService,
    },
  });

  return { app, permissionPolicyRepository };
}

async function registerAndLogin(app: ReturnType<typeof buildApp>["app"], email: string) {
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

describe("POST /api/v1/authorization/grants", () => {
  it("403s a random authenticated user trying to grant themselves a permission", async () => {
    const { app } = buildApp();
    const ownerCookie = await registerAndLogin(app, "owner@example.com");
    const attackerCookie = await registerAndLogin(app, "attacker@example.com");

    const communityRes = await request(app)
      .post("/api/v1/communities")
      .set("Cookie", ownerCookie)
      .set("X-Requested-With", "XMLHttpRequest")
      .send({ name: "Owner Community", slug: "owner-community" });
    const communityId = communityRes.body.id;

    const res = await request(app)
      .post("/api/v1/authorization/grants")
      .set("Cookie", attackerCookie)
      .set("X-Requested-With", "XMLHttpRequest")
      .send({
        permissionId: "00000000-0000-0000-0000-000000000001",
        contextLevel: "Community",
        contextId: communityId,
        responsibilityRef: { type: "CommunityPosition", id: "00000000-0000-0000-0000-000000000002" },
      });

    expect(res.status).toBe(403);
  });

  it("rejects Platform-scoped grant creation outright (no bootstrap mechanism exists)", async () => {
    const { app } = buildApp();
    const cookie = await registerAndLogin(app, "someone@example.com");

    const res = await request(app)
      .post("/api/v1/authorization/grants")
      .set("Cookie", cookie)
      .set("X-Requested-With", "XMLHttpRequest")
      .send({
        permissionId: "00000000-0000-0000-0000-000000000001",
        contextLevel: "Platform",
        contextId: null,
        responsibilityRef: { type: "PlatformAdmin", id: "00000000-0000-0000-0000-000000000003" },
      });

    expect(res.status).toBe(403);
  });

  it("allows the community owner to create a grant in their own community", async () => {
    const { app } = buildApp();
    const ownerCookie = await registerAndLogin(app, "owner2@example.com");

    const communityRes = await request(app)
      .post("/api/v1/communities")
      .set("Cookie", ownerCookie)
      .set("X-Requested-With", "XMLHttpRequest")
      .send({ name: "Owner Community 2", slug: "owner-community-2" });
    const communityId = communityRes.body.id;

    const permissionRes = await request(app)
      .post("/api/v1/authorization/permissions")
      .set("Cookie", ownerCookie)
      .set("X-Requested-With", "XMLHttpRequest")
      .send({ name: "custom:permission", description: "test" });

    const res = await request(app)
      .post("/api/v1/authorization/grants")
      .set("Cookie", ownerCookie)
      .set("X-Requested-With", "XMLHttpRequest")
      .send({
        permissionId: permissionRes.body.permissionId,
        contextLevel: "Community",
        contextId: communityId,
        responsibilityRef: { type: "CommunityPosition", id: "some-position-id" },
      });

    expect(res.status).toBe(201);
  });
});
