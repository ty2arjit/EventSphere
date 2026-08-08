import { describe, it, expect } from "vitest";
import { EventCommittee } from "./EventCommittee";

describe("EventCommittee", () => {
  function makeCommittee() {
    return EventCommittee.create("event-1", "community-1", "Tech Fest Committee");
  }

  it("creates in Planning state", () => {
    const c = makeCommittee();
    expect(c.state).toBe("Planning");
    expect(c.roles).toHaveLength(0);
    expect(c.assignments).toHaveLength(0);
  });

  it("follows lifecycle: Planning → Formation → Active → Completed → Archived", () => {
    const c = makeCommittee();
    c.startFormation();
    expect(c.state).toBe("Formation");
    c.activate();
    expect(c.state).toBe("Active");
    c.complete();
    expect(c.state).toBe("Completed");
    c.archive();
    expect(c.state).toBe("Archived");
  });

  it("rejects invalid transition", () => {
    const c = makeCommittee();
    expect(() => c.activate()).toThrow("Cannot transition");
  });

  it("rejects modifications on archived committee", () => {
    const c = makeCommittee();
    c.startFormation();
    c.activate();
    c.complete();
    c.archive();
    expect(() => c.addRole("Lead")).toThrow("terminal state");
  });

  it("adds and updates roles", () => {
    const c = makeCommittee();
    const role = c.addRole("Event Director", "Oversees everything");
    expect(c.roles).toHaveLength(1);
    expect(role.name).toBe("Event Director");

    c.updateRole(role.id, "Chief Director", "Still oversees everything");
    expect(c.roles[0]!.name).toBe("Chief Director");
  });

  it("rejects duplicate role names (case-insensitive)", () => {
    const c = makeCommittee();
    c.addRole("Technical Lead");
    expect(() => c.addRole("technical lead")).toThrow("already exists");
  });

  it("assigns a member to a role", () => {
    const c = makeCommittee();
    const role = c.addRole("Tech Lead");
    const assignment = c.assignMember(role.id, "user-1");
    expect(assignment.isActive).toBe(true);
    expect(c.getActiveAssignmentsForRole(role.id)).toHaveLength(1);
  });

  it("rejects duplicate active assignment", () => {
    const c = makeCommittee();
    const role = c.addRole("Lead");
    c.assignMember(role.id, "user-1");
    expect(() => c.assignMember(role.id, "user-1")).toThrow("already assigned");
  });

  it("removes an assignment", () => {
    const c = makeCommittee();
    const role = c.addRole("Lead");
    const assignment = c.assignMember(role.id, "user-1");
    c.removeAssignment(assignment.id);
    expect(c.getActiveAssignmentsForRole(role.id)).toHaveLength(0);
  });

  it("gets user roles", () => {
    const c = makeCommittee();
    const r1 = c.addRole("Lead");
    const r2 = c.addRole("Co-Lead");
    c.assignMember(r1.id, "user-1");
    c.assignMember(r2.id, "user-1");
    expect(c.getUserRoles("user-1")).toHaveLength(2);
  });

  it("sets reporting relationship", () => {
    const c = makeCommittee();
    const director = c.addRole("Director");
    const lead = c.addRole("Lead");
    c.setReportingRelation(lead.id, director.id);
    expect(lead.reportsToRoleId).toBe(director.id);
  });

  it("prevents self-reporting", () => {
    const c = makeCommittee();
    const role = c.addRole("Lead");
    expect(() => c.setReportingRelation(role.id, role.id)).toThrow("cannot report to itself");
  });

  it("detects circular reporting", () => {
    const c = makeCommittee();
    const a = c.addRole("A");
    const b = c.addRole("B");
    const d = c.addRole("C");
    c.setReportingRelation(b.id, a.id);
    c.setReportingRelation(d.id, b.id);
    expect(() => c.setReportingRelation(a.id, d.id)).toThrow("Circular");
  });

  it("completes all active assignments when committee completes", () => {
    const c = makeCommittee();
    const role = c.addRole("Lead");
    c.assignMember(role.id, "user-1");
    c.assignMember(role.id, "user-2");
    c.startFormation();
    c.activate();
    c.complete();
    expect(c.assignments.every((a) => a.status === "Completed")).toBe(true);
  });

  it("clears reporting relation", () => {
    const c = makeCommittee();
    const director = c.addRole("Director");
    const lead = c.addRole("Lead");
    c.setReportingRelation(lead.id, director.id);
    c.setReportingRelation(lead.id, null);
    expect(lead.reportsToRoleId).toBeNull();
  });
});
