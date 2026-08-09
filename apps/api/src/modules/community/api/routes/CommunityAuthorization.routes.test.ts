import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../../../app";
import { InMemoryProfileRepository } from "../../../profile/test-support/InMemoryProfileRepository";
import { RecordingEventPublisher } from "../../../profile/test-support/RecordingEventPublisher";
import { InMemoryCommunityRepository } from "../../test-support/InMemoryCommunityRepository";
import { InMemoryUserCredentialRepository } from "../../../authentication/test-support/InMemoryUserCredentialRepository";
import { InMemoryPermissionPolicyRepository } from "../../../authorization/test-support/InMemoryPermissionPolicyRepository";
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
import { AuthorizeResourceActionService } from "../../../authorization/application/AuthorizeResourceActionService";

/**
 * Regression coverage for a real, wide-reaching gap: PATCH /:id, position
 * management, invitations, settings, and (worst of all) transfer-ownership
 * had `requireAuth` but no check that the caller actually had any
 * relationship to the target community. Any logged-in user could rename
 * someone else's community, create positions in it, invite people to it,
 * or transfer its ownership to themselves — a full takeover, with nothing
 * stopping it but obscurity. Fixed by gating mutating routes on
 * community:manage (owner fast path covers the normal case) and, for
 * ownership transfer specifically, a stricter owner-only check that isn't
 * delegable at all.
 *
 * One shared app + two users (owner, stranger) for the whole file rather
 * than fresh registrations per test — authRateLimit is a module-level
 * singleton (10 requests/15min), and this file would trip it if every
 * test registered its own pair of users.
 */
function buildApp() {
  const profileRepository = new InMemoryProfileRepository();
  const eventPublisher = new RecordingEventPublisher();
  const communityRepository = new InMemoryCommunityRepository();
  const credentialRepository = new InMemoryUserCredentialRepository();
  const permissionPolicyRepository = new InMemoryPermissionPolicyRepository();
  const jwtService = new FakeJwtService();
  const authorizeResourceActionService = new AuthorizeResourceActionService(
    permissionPolicyRepository,
    communityRepository,
  );

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
    communityDependencies: {
      communityRepository,
      eventPublisher,
      authorizeResourceActionService,
    },
  });
}

async function login(app: ReturnType<typeof buildApp>, email: string) {
  const res = await request(app)
    .post("/api/v1/auth/login")
    .set("X-Requested-With", "XMLHttpRequest")
    .send({ email, password: "correcthorse1battery" });
  const cookies = res.headers["set-cookie"] as unknown as string[];
  return cookies.map((c) => c.split(";")[0]).join("; ");
}

describe("Community mutation routes require community:manage", () => {
  const app = buildApp();
  let ownerCookie: string;
  let strangerCookie: string;
  let communityId: string;

  beforeAll(async () => {
    await request(app)
      .post("/api/v1/auth/register")
      .set("X-Requested-With", "XMLHttpRequest")
      .send({ email: "owner@example.com", name: "Owner", password: "correcthorse1battery" });
    await request(app)
      .post("/api/v1/auth/register")
      .set("X-Requested-With", "XMLHttpRequest")
      .send({ email: "stranger@example.com", name: "Stranger", password: "correcthorse1battery" });

    ownerCookie = await login(app, "owner@example.com");
    strangerCookie = await login(app, "stranger@example.com");

    const res = await request(app)
      .post("/api/v1/communities")
      .set("Cookie", ownerCookie)
      .set("X-Requested-With", "XMLHttpRequest")
      .send({ name: "Test Community", slug: "test-community" });
    communityId = res.body.id;
  });

  it("blocks a random user from renaming someone else's community", async () => {
    const res = await request(app)
      .patch(`/api/v1/communities/${communityId}`)
      .set("Cookie", strangerCookie)
      .set("X-Requested-With", "XMLHttpRequest")
      .send({ name: "Hijacked Name" });

    expect(res.status).toBe(403);
  });

  it("blocks a random user from creating a position in someone else's community", async () => {
    const res = await request(app)
      .post(`/api/v1/communities/${communityId}/positions`)
      .set("Cookie", strangerCookie)
      .set("X-Requested-With", "XMLHttpRequest")
      .send({ name: "Fake Position", description: null, allowsMultipleHolders: false });

    expect(res.status).toBe(403);
  });

  it("blocks a random user from inviting people to someone else's community", async () => {
    const res = await request(app)
      .post(`/api/v1/communities/${communityId}/invitations`)
      .set("Cookie", strangerCookie)
      .set("X-Requested-With", "XMLHttpRequest")
      .send({ email: "victim@example.com" });

    expect(res.status).toBe(403);
  });

  it("blocks a random user from transferring someone else's community to themselves", async () => {
    const res = await request(app)
      .post(`/api/v1/communities/${communityId}/transfer-ownership`)
      .set("Cookie", strangerCookie)
      .set("X-Requested-With", "XMLHttpRequest")
      .send({ newOwnerId: "attacker-user-id" });

    expect(res.status).toBe(403);
  });

  it("allows the owner to rename their own community", async () => {
    const res = await request(app)
      .patch(`/api/v1/communities/${communityId}`)
      .set("Cookie", ownerCookie)
      .set("X-Requested-With", "XMLHttpRequest")
      .send({ name: "Renamed By Owner" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Renamed By Owner");
  });

  it("allows the owner to invite people to their own community", async () => {
    const res = await request(app)
      .post(`/api/v1/communities/${communityId}/invitations`)
      .set("Cookie", ownerCookie)
      .set("X-Requested-With", "XMLHttpRequest")
      .send({ email: "friend@example.com" });

    expect(res.status).toBe(201);
  });
});
