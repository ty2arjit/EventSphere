import { describe, it, expect } from 'vitest';
import { Community } from './Community';
import {
  MemberAlreadyExistsError,
  CannotRemoveOwnerError,
  MemberNotFoundError,
  PositionAlreadyExistsError,
  NotAMemberError,
  PositionSingleHolderError,
  OwnershipTransferToSelfError,
} from './errors';

function createTestCommunity() {
  return Community.create({
    name: 'Test Community',
    slug: 'test-community',
    description: 'A test community',
    ownerId: 'owner-1',
  });
}

describe('Community aggregate', () => {
  describe('creation', () => {
    it('creates with owner as first member', () => {
      const community = createTestCommunity();
      expect(community.name).toBe('Test Community');
      expect(community.ownerId).toBe('owner-1');
      expect(community.activeMembers).toHaveLength(1);
      expect(community.activeMembers[0]!.userId).toBe('owner-1');
    });

    it('emits CommunityCreated and MemberJoined events', () => {
      const community = createTestCommunity();
      const events = community.pullDomainEvents();
      expect(events).toHaveLength(2);
      expect(events[0]!.eventType).toBe('CommunityCreated');
      expect(events[1]!.eventType).toBe('MemberJoined');
    });
  });

  describe('membership', () => {
    it('adds a member', () => {
      const community = createTestCommunity();
      community.pullDomainEvents();
      community.addMember('user-2');
      expect(community.activeMembers).toHaveLength(2);
      const events = community.pullDomainEvents();
      expect(events[0]!.eventType).toBe('MemberJoined');
    });

    it('rejects duplicate membership', () => {
      const community = createTestCommunity();
      expect(() => community.addMember('owner-1')).toThrow(MemberAlreadyExistsError);
    });

    it('removes a member', () => {
      const community = createTestCommunity();
      community.addMember('user-2');
      community.pullDomainEvents();
      community.removeMember('user-2');
      expect(community.activeMembers).toHaveLength(1);
    });

    it('cannot remove the owner', () => {
      const community = createTestCommunity();
      expect(() => community.removeMember('owner-1')).toThrow(CannotRemoveOwnerError);
    });

    it('throws for removing non-member', () => {
      const community = createTestCommunity();
      expect(() => community.removeMember('unknown')).toThrow(MemberNotFoundError);
    });
  });

  describe('positions', () => {
    it('creates a position', () => {
      const community = createTestCommunity();
      const position = community.createPosition('President', 'Leader', false);
      expect(position.name).toBe('President');
      expect(community.positions).toHaveLength(1);
    });

    it('rejects duplicate position names', () => {
      const community = createTestCommunity();
      community.createPosition('President', null, false);
      expect(() => community.createPosition('president', null, false)).toThrow(PositionAlreadyExistsError);
    });

    it('assigns position to member', () => {
      const community = createTestCommunity();
      const position = community.createPosition('President', null, false);
      const ownerMember = community.activeMembers[0]!;
      community.pullDomainEvents();
      community.assignPosition(position.id, ownerMember.id);
      expect(position.activeAssignments).toHaveLength(1);
      const events = community.pullDomainEvents();
      expect(events[0]!.eventType).toBe('PositionAssigned');
    });

    it('rejects single-holder position if already held', () => {
      const community = createTestCommunity();
      community.addMember('user-2');
      const position = community.createPosition('President', null, false);
      const member1 = community.activeMembers[0]!;
      const member2 = community.activeMembers[1]!;
      community.assignPosition(position.id, member1.id);
      expect(() => community.assignPosition(position.id, member2.id)).toThrow(PositionSingleHolderError);
    });

    it('allows multiple holders when configured', () => {
      const community = createTestCommunity();
      community.addMember('user-2');
      const position = community.createPosition('Committee Member', null, true);
      const member1 = community.activeMembers[0]!;
      const member2 = community.activeMembers[1]!;
      community.assignPosition(position.id, member1.id);
      community.assignPosition(position.id, member2.id);
      expect(position.activeAssignments).toHaveLength(2);
    });

    it('only members can hold positions', () => {
      const community = createTestCommunity();
      const position = community.createPosition('President', null, false);
      expect(() => community.assignPosition(position.id, 'fake-member')).toThrow(NotAMemberError);
    });

    it('removes member from positions when removed from community', () => {
      const community = createTestCommunity();
      community.addMember('user-2');
      const position = community.createPosition('VP', null, true);
      const member2 = community.activeMembers.find((m) => m.userId === 'user-2')!;
      community.assignPosition(position.id, member2.id);
      community.pullDomainEvents();
      community.removeMember('user-2');
      expect(position.activeAssignments).toHaveLength(0);
      const events = community.pullDomainEvents();
      const types = events.map((e) => e.eventType);
      expect(types).toContain('PositionRemoved');
      expect(types).toContain('MemberRemoved');
    });
  });

  describe('ownership transfer', () => {
    it('transfers ownership', () => {
      const community = createTestCommunity();
      community.addMember('user-2');
      community.pullDomainEvents();
      community.transferOwnership('user-2');
      expect(community.ownerId).toBe('user-2');
      const events = community.pullDomainEvents();
      expect(events[0]!.eventType).toBe('CommunityOwnershipTransferred');
    });

    it('cannot transfer to self', () => {
      const community = createTestCommunity();
      expect(() => community.transferOwnership('owner-1')).toThrow(OwnershipTransferToSelfError);
    });

    it('cannot transfer to non-member', () => {
      const community = createTestCommunity();
      expect(() => community.transferOwnership('not-a-member')).toThrow(NotAMemberError);
    });
  });

  describe('invitations', () => {
    it('creates an invitation', () => {
      const community = createTestCommunity();
      const invitation = community.createInvitation('new@example.com', 'owner-1');
      expect(invitation.status).toBe('pending');
      expect(community.invitations).toHaveLength(1);
    });

    it('accepts invitation and adds member', () => {
      const community = createTestCommunity();
      const invitation = community.createInvitation('new@example.com', 'owner-1');
      community.pullDomainEvents();
      community.acceptInvitation(invitation.id, 'user-3');
      expect(community.activeMembers).toHaveLength(2);
      expect(invitation.status).toBe('accepted');
    });
  });
});
