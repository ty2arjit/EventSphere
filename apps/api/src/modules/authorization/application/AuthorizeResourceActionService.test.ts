import { describe, it, expect, beforeEach } from "vitest";
import { AuthorizeResourceActionService } from "./AuthorizeResourceActionService";
import { InMemoryPermissionPolicyRepository } from "../test-support/InMemoryPermissionPolicyRepository";
import { InMemoryCommunityRepository } from "../../community/test-support/InMemoryCommunityRepository";
import { InMemoryEventCommitteeRepository } from "../../committee/test-support/InMemoryEventCommitteeRepository";
import { Community } from "../../community/domain/Community";
import { EventCommittee } from "../../committee/domain/EventCommittee";
import { createResponsibilityReference } from "../domain/valueObjects/ResponsibilityReference";

describe("AuthorizeResourceActionService", () => {
  let policyRepo: InMemoryPermissionPolicyRepository;
  let communityRepo: InMemoryCommunityRepository;
  let committeeRepo: InMemoryEventCommitteeRepository;
  let service: AuthorizeResourceActionService;

  const OWNER_ID = "owner-1";
  const OUTSIDER_ID = "outsider-1";
  const PERMISSION = "task:manage";

  beforeEach(() => {
    policyRepo = new InMemoryPermissionPolicyRepository();
    communityRepo = new InMemoryCommunityRepository();
    committeeRepo = new InMemoryEventCommitteeRepository();
    service = new AuthorizeResourceActionService(policyRepo, communityRepo, committeeRepo);
  });

  it("allows the community owner even with zero grants seeded", async () => {
    const community = Community.create({ name: "C1", slug: "c1", description: null, ownerId: OWNER_ID });
    await communityRepo.save(community);

    const allowed = await service.isAllowed({
      userId: OWNER_ID,
      permissionName: PERMISSION,
      communityId: community.id,
    });

    expect(allowed).toBe(true);
  });

  it("denies an unrelated user with no membership and no grants", async () => {
    const community = Community.create({ name: "C1", slug: "c1", description: null, ownerId: OWNER_ID });
    await communityRepo.save(community);

    const allowed = await service.isAllowed({
      userId: OUTSIDER_ID,
      permissionName: PERMISSION,
      communityId: community.id,
    });

    expect(allowed).toBe(false);
  });

  it("denies a community member holding no position", async () => {
    const community = Community.create({ name: "C1", slug: "c1", description: null, ownerId: OWNER_ID });
    community.addMember(OUTSIDER_ID);
    await communityRepo.save(community);

    const allowed = await service.isAllowed({
      userId: OUTSIDER_ID,
      permissionName: PERMISSION,
      communityId: community.id,
    });

    expect(allowed).toBe(false);
  });

  it("allows a member holding a position with an active grant at Community context", async () => {
    const community = Community.create({ name: "C1", slug: "c1", description: null, ownerId: OWNER_ID });
    const member = community.addMember(OUTSIDER_ID);
    const position = community.createPosition("Organizer", null, true);
    community.assignPosition(position.id, member.id);
    await communityRepo.save(community);

    const policy = await policyRepo.load();
    const permission = policy.addPermission(PERMISSION, null);
    policy.grantPermission(
      permission.id,
      "Community",
      community.id,
      createResponsibilityReference("CommunityPosition", position.id),
    );
    await policyRepo.save(policy);

    const allowed = await service.isAllowed({
      userId: OUTSIDER_ID,
      permissionName: PERMISSION,
      communityId: community.id,
    });

    expect(allowed).toBe(true);
  });

  it("denies a member whose position grant is for a different permission", async () => {
    const community = Community.create({ name: "C1", slug: "c1", description: null, ownerId: OWNER_ID });
    const member = community.addMember(OUTSIDER_ID);
    const position = community.createPosition("Organizer", null, true);
    community.assignPosition(position.id, member.id);
    await communityRepo.save(community);

    const policy = await policyRepo.load();
    const permission = policy.addPermission("announcement:manage", null);
    policy.grantPermission(
      permission.id,
      "Community",
      community.id,
      createResponsibilityReference("CommunityPosition", position.id),
    );
    await policyRepo.save(policy);

    const allowed = await service.isAllowed({
      userId: OUTSIDER_ID,
      permissionName: PERMISSION,
      communityId: community.id,
    });

    expect(allowed).toBe(false);
  });

  it("denies once the grant has been revoked", async () => {
    const community = Community.create({ name: "C1", slug: "c1", description: null, ownerId: OWNER_ID });
    const member = community.addMember(OUTSIDER_ID);
    const position = community.createPosition("Organizer", null, true);
    community.assignPosition(position.id, member.id);
    await communityRepo.save(community);

    const policy = await policyRepo.load();
    const permission = policy.addPermission(PERMISSION, null);
    const grant = policy.grantPermission(
      permission.id,
      "Community",
      community.id,
      createResponsibilityReference("CommunityPosition", position.id),
    );
    policy.revokeGrant(grant.id);
    await policyRepo.save(policy);

    const allowed = await service.isAllowed({
      userId: OUTSIDER_ID,
      permissionName: PERMISSION,
      communityId: community.id,
    });

    expect(allowed).toBe(false);
  });

  it("allows a committee role holder via an Event-context grant when eventId is provided", async () => {
    const community = Community.create({ name: "C1", slug: "c1", description: null, ownerId: OWNER_ID });
    await communityRepo.save(community);

    const eventId = "event-1";
    const committee = EventCommittee.create(eventId, community.id, "Core Team");
    const role = committee.addRole("Logistics Lead", null);
    committee.assignMember(role.id, OUTSIDER_ID);
    await committeeRepo.save(committee);

    const policy = await policyRepo.load();
    const permission = policy.addPermission(PERMISSION, null);
    policy.grantPermission(
      permission.id,
      "Event",
      eventId,
      createResponsibilityReference("CommitteeRole", role.id),
    );
    await policyRepo.save(policy);

    const allowed = await service.isAllowed({
      userId: OUTSIDER_ID,
      permissionName: PERMISSION,
      communityId: community.id,
      eventId,
    });

    expect(allowed).toBe(true);
  });

  it("ignores committee-role grants when no eventId is given", async () => {
    const community = Community.create({ name: "C1", slug: "c1", description: null, ownerId: OWNER_ID });
    await communityRepo.save(community);

    const eventId = "event-1";
    const committee = EventCommittee.create(eventId, community.id, "Core Team");
    const role = committee.addRole("Logistics Lead", null);
    committee.assignMember(role.id, OUTSIDER_ID);
    await committeeRepo.save(committee);

    const policy = await policyRepo.load();
    const permission = policy.addPermission(PERMISSION, null);
    policy.grantPermission(
      permission.id,
      "Event",
      eventId,
      createResponsibilityReference("CommitteeRole", role.id),
    );
    await policyRepo.save(policy);

    const allowed = await service.isAllowed({
      userId: OUTSIDER_ID,
      permissionName: PERMISSION,
      communityId: community.id,
      // no eventId
    });

    expect(allowed).toBe(false);
  });

  it("allows via a blanket Platform-level grant regardless of community", async () => {
    const community = Community.create({ name: "C1", slug: "c1", description: null, ownerId: OWNER_ID });
    const member = community.addMember(OUTSIDER_ID);
    const position = community.createPosition("Organizer", null, true);
    community.assignPosition(position.id, member.id);
    await communityRepo.save(community);

    const policy = await policyRepo.load();
    const permission = policy.addPermission(PERMISSION, null);
    policy.grantPermission(
      permission.id,
      "Platform",
      null,
      createResponsibilityReference("CommunityPosition", position.id),
    );
    await policyRepo.save(policy);

    const allowed = await service.isAllowed({
      userId: OUTSIDER_ID,
      permissionName: PERMISSION,
      communityId: community.id,
    });

    expect(allowed).toBe(true);
  });

  it("denies when the community does not exist", async () => {
    const allowed = await service.isAllowed({
      userId: OWNER_ID,
      permissionName: PERMISSION,
      communityId: "nonexistent",
    });

    expect(allowed).toBe(false);
  });
});
