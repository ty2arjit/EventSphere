import { describe, it, expect } from "vitest";
import { Announcement } from "./Announcement";

describe("Announcement", () => {
  function makeAnnouncement() {
    return Announcement.create("author-1", "Event Update", "Registration is now open!", {
      communityId: "comm-1",
      eventId: "event-1",
    });
  }

  it("creates as draft", () => {
    const a = makeAnnouncement();
    expect(a.isDraft).toBe(true);
    expect(a.publishedAt).toBeNull();
  });

  it("publishes", () => {
    const a = makeAnnouncement();
    a.publish();
    expect(a.isDraft).toBe(false);
    expect(a.publishedAt).toBeTruthy();
  });

  it("rejects double publish", () => {
    const a = makeAnnouncement();
    a.publish();
    expect(() => a.publish()).toThrow("already published");
  });

  it("unpublishes", () => {
    const a = makeAnnouncement();
    a.publish();
    a.unpublish();
    expect(a.isDraft).toBe(true);
    expect(a.publishedAt).toBeNull();
  });

  it("tracks expiry", () => {
    const a = makeAnnouncement();
    a.setExpiry(new Date("2020-01-01"));
    expect(a.isExpired).toBe(true);
  });

  it("updates content", () => {
    const a = makeAnnouncement();
    a.update("New Title", "New Body", "Urgent");
    expect(a.title).toBe("New Title");
    expect(a.priority).toBe("Urgent");
  });
});
