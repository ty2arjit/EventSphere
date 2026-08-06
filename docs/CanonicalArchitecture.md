# EventSphere — Canonical Architecture Specification

**Status:** Living document. Sections are approved incrementally.

**Authority:** This specification is the single source of truth for the EventSphere architecture. Where it conflicts with any summary chapter in the Product Bible (including but not limited to Chapter 17 — Domain Map, Chapter 39 — Platform Architecture, Chapter 41 — Trust, Security & Governance, Chapter 44 — Engineering Standards), this specification is authoritative. Detailed domain chapters (Chapters 18–38) were treated as the primary source of truth during construction of this document; summary chapters were used only where they did not conflict with the detailed chapters or were explicitly confirmed by the project owner.

---

## 1. Canonical Bounded Context Inventory

**Section status: Approved. Amended once — see 1.1a.**

### 1.1 Confirmed Bounded Contexts

Contexts in this table are backed by a detailed domain chapter (18–38) and have been explicitly confirmed by the project owner, including naming and boundary decisions where prior chapters disagreed.

**Maturity values used in this table:**
- **Implemented Design** — backed by a full detailed domain chapter (aggregate contract, invariants, business rules).
- **Architecturally Approved** — confirmed as canonical by the project owner, but not yet backed by a detailed domain chapter or full aggregate contract.
- *(Future Candidate — used only in Section 1.2; not a status any context in this table currently holds.)*

| # | Bounded Context | Type (as stated in source) | Maturity | Primary Responsibility | Source Chapter(s) | Notes |
|---|---|---|---|---|---|---|
| 1 | Profile Domain | Not classified at domain level (constituent aggregate: Core Aggregate) | Implemented Design | Represents the permanent identity and profile of every individual | Ch.19 | Canonical name is **Profile Domain**. Supersedes "User Domain" (Ch.19 self-declaration) and "User Profile Domain" (earlier review round) |
| 2 | Authentication Domain | Supporting Domain | Implemented Design | Verifies user identity; owns credentials, sessions, verification | Ch.20 | Separate from Authorization and Profile |
| 3 | Authorization Domain | Supporting Domain | Implemented Design | Evaluates contextual permissions; owns policy and permission resolution | Ch.21 | Separate from Authentication and Profile |
| 4 | Community Domain | Core Domain | Implemented Design | Manages long-lived organizational identity, membership, positions | Ch.18 | |
| 5 | Event Management | Not classified at domain level (constituent aggregates: Core Aggregate) | Implemented Design | Owns event identity, lifecycle, workspace composition, and sessions | Ch.22, 23, 24, 25 | Self-declared identically across all four chapters |
| 6 | Participation Management | Not classified at domain level (constituent aggregates: Core Aggregate) | Implemented Design | Owns the participation lifecycle: registration policy, enrollment, attendance, certification | Ch.26, 27, 28, 29 | Intentional consolidation of four aggregates into one bounded context |
| 7 | Committee Domain | Core Operational Domain | Implemented Design | Defines the temporary organizational structure for one event | Ch.32 | Separate bounded context. Ch.39's "Organizational Operations" consolidation (Committee + Volunteer + Sponsorship) is superseded and does not apply |
| 8 | Volunteer Domain | Not specified in source | Implemented Design | Manages operational task execution for event delivery | Ch.33 | Separate bounded context (see note on Committee Domain) |
| 9 | Sponsorship Domain | Core Operational Domain | Implemented Design | Manages sponsorship relationships, contributions, and deliverables | Ch.34 | Separate bounded context (see note on Committee Domain) |
| 10 | Announcement Domain | Not classified at domain level (aggregate: Core Aggregate) | Implemented Design | Owns announcement lifecycle, publication, audience selection, scheduling, and announcement business rules | Ch.30 | Separate bounded context. Answers "what should be communicated." Ch.39's "Communication" consolidation (Announcement + Notification) is superseded and does not apply |
| 11 | Notification Domain | Supporting Domain | Implemented Design | Owns notification delivery: channels, retry policy, delivery status, notification preferences | Ch.31 | Separate bounded context. Answers "how it should be communicated" (see note on Announcement Domain) |
| 12 | Analytics Domain | Supporting Domain | Implemented Design | Transforms operational data into standardized, trusted metrics | Ch.35 | |
| 13 | Intelligence Domain | Supporting Domain | Implemented Design | Produces AI-generated insights, summaries, and predictions | Ch.36 | Separate bounded context. Ch.39's "Intelligence" consolidation (Intelligence + Recommendation) is superseded and does not apply |
| 14 | Recommendation Domain | Supporting Domain | Implemented Design | Ranks, explains, and surfaces actionable recommendations from multiple signal sources (including but not limited to Intelligence) | Ch.37 | Separate bounded context (see note on Intelligence Domain). **Canonical name is Recommendation Domain** — Ch.37 self-declares "Recommendation Engine," but that name describes an implementation concept, not a business capability; renamed for consistency with the "...Domain" naming pattern used across the rest of the confirmed inventory. See 1.1a. |
| 15 | Content Domain | Not yet classified — no detailed domain chapter | Architecturally Approved | Owns media assets, documents, galleries, attachments, event photos, videos, and related content lifecycle management | None (introduced during Section 4 resolution) | Added after initial freeze of Section 1 to resolve Open Decision 4.16.1 (Media & Documentation had no owning bounded context). No aggregate contract yet — see Section 3 note on aggregate coverage. |

### 1.1a Amendment Log

| Date/Trigger | Change | Reason |
|---|---|---|
| During Section 4 drafting | Added **Content Domain** (#15) to the confirmed inventory with Maturity = Architecturally Approved | Project owner directive resolving Open Decision 4.16.1 — Media & Documentation had no owning bounded context in the original Section 1 |
| During Section 4 drafting | Renamed **Recommendation Engine** (#14) to **Recommendation Domain** throughout the specification (Sections 1–4) | Project owner directive: this specification models business architecture, not implementation. "Engine" describes an implementation concept; "Domain" describes a business capability/bounded context. The Recommendation Domain may contain an implementation-level recommendation/ranking/personalization engine, but the bounded context itself is named Recommendation Domain, consistent with the "...Domain" pattern used by the other 14 confirmed contexts |

### 1.2 Future / Planned Bounded Contexts

These contexts are named in summary-level material or emerged during review discussion, but no detailed domain chapter (18–38) defines their aggregates, business rules, or boundaries. They are excluded from the confirmed inventory (1.1) until dedicated domain chapters are produced.

| Bounded Context | Where Referenced | Maturity | Notes |
|---|---|---|---|
| Feedback Domain | Ch.24, 25, 27 (as consumer/dependency); review discussion | Future Candidate | Project owner confirmed intent for this to become an independent bounded context responsible for surveys, ratings, reflections, and related participation feedback capabilities |
| Search Domain | Ch.17, Ch.42 (Stage 3 extraction candidate) | Future Candidate | Not discussed during review |
| Administration Domain | Ch.13 (Module 14), Ch.17 | Future Candidate | Not discussed during review |
| Settings Domain | Ch.17 | Future Candidate | Not discussed during review |
| Integration Domain | Ch.17 | Future Candidate | Not discussed during review |

### 1.3 Excluded — Cross-Cutting Concerns and Architectural Patterns (Not Bounded Contexts)

The following are platform-wide mechanisms or architectural patterns that apply across bounded contexts. None owns a business capability with a single accountable domain, so none appears in the Bounded Context Inventory.

| Name | Source Chapter | Nature |
|---|---|---|
| Domain Events & Event Bus | Ch.38 | Platform infrastructure — inter-context communication mechanism |
| CQRS & Read Models | Ch.40 | Architectural pattern — presentation/read-side strategy |
| Trust, Security & Governance | Ch.41 | Cross-cutting concern — explicitly self-described as applying to "every bounded context and supporting domain" |

---

## 2. Canonical Aggregate Inventory

**Section status: Approved.**

### 2.1 True Business Aggregates

These aggregates have a full contract in source (aggregate root, consistency boundary, invariants) and enforce transactional consistency for their bounded context.

| Aggregate Root | Bounded Context | Classification | Owned Entities | Key Value Objects | Source Chapter |
|---|---|---|---|---|---|
| User | Profile Domain | Transactional Aggregate | UserProfile, UserPreferences | Email, FullName, Avatar, SocialLinks (future) | Ch.19 |
| UserCredential | Authentication Domain | Transactional Aggregate | Authentication Sessions, Verification Tokens, Authentication Provider | — | Ch.20 |
| PermissionPolicy | Authorization Domain | Policy Aggregate | Permission, PermissionGrant | ContextLevel, ResponsibilityReference, AuthorizationDecision | Ch.21 (structure formalized in this specification — see 2.1.1) |
| Community | Community Domain | Transactional Aggregate | CommunityMember, CommunityPosition, CommunityInvitation, CommunitySettings | — | Ch.18 |
| Event | Event Management | Transactional Aggregate | EventSettings, EventTimeline, Team (internal entity — confirmed during specification review; not present in Ch.22 itself) | Location, Capacity, EventDuration | Ch.22 |
| Session | Event Management | Transactional Aggregate | SessionSchedule, SessionResources | TimeSlot, RoomAssignment | Ch.25 |
| Registration | Participation Management | Transactional Aggregate | RegistrationForm, RegistrationQuestion, RegistrationRule(s) | RegistrationWindow, CapacityPolicy, ApprovalPolicy | Ch.26 |
| Enrollment | Participation Management | Transactional Aggregate | EnrollmentResponse, EnrollmentApproval | EnrollmentStatus, TeamReference | Ch.27 |
| Attendance | Participation Management | Transactional Aggregate | AttendanceRecord, AttendanceVerification | AttendanceStatus, CheckInTime, CheckOutTime | Ch.28 |
| Certificate | Participation Management | Transactional Aggregate | RecognitionPolicy, CertificateIssue, CertificateTemplate | CertificateStatus, VerificationCode, IssueDate | Ch.29 |
| Announcement | Announcement Domain | Transactional Aggregate | AnnouncementAudience, AnnouncementSchedule, AnnouncementAttachment | AnnouncementStatus, Priority, PublishWindow | Ch.30 |
| EventCommittee | Committee Domain | Transactional Aggregate | CommitteeRole, RoleAssignment, ReportingHierarchy | — | Ch.32 |
| OperationalTask | Volunteer Domain | Transactional Aggregate | TaskAssignment, TaskDependency, TaskChecklist | — | Ch.33 |
| SponsorshipAgreement | Sponsorship Domain | Transactional Aggregate | Contribution, Deliverable, SponsorshipContact (also references SponsorOrganization, which remains a referenced business entity, not a separate aggregate — confirmed) | — | Ch.34 |

### 2.1.1 Permission Policy — Formalized Aggregate (Authorization Domain)

*Ch.21 described the Authorization Domain's core concepts narratively but did not provide a formal aggregate contract. The structure below is formalized in this specification at the project owner's direction, using only concepts already established in Ch.21 (Context, Permission, Policy, Authorization Decision) plus the earlier confirmed clarification that Role is a transient, non-persisted construct rather than an owned entity.*

**Aggregate Root:** `PermissionPolicy`
**Classification:** Policy Aggregate

**Owned Entities**
- **Permission** — a named, platform-wide unique business capability (e.g., `CreateEvent`, `PublishAnnouncement`, `ManageRegistrations`). Corresponds to Ch.21's "Permission" concept.
- **PermissionGrant** — binds one Permission to a Context Level and a Responsibility Reference; represents one authorization rule (e.g., "within Community context, the referenced Community Position may perform CreateEvent"). Corresponds to Ch.21's "Policy" concept, decomposed into individually addressable grants.

**Value Objects**
- **ContextLevel** — one of `Platform`, `Community`, `Event`, per the Authorization Hierarchy defined in Ch.21.
- **ResponsibilityReference** — a reference to the external, authoritative source of a responsibility (a Community Position from Community Domain, a Committee Role from Committee Domain, or a Platform Administrator designation). Never a direct reference to a User. This is how the aggregate satisfies Ch.21's invariant "Permissions are never assigned directly to Users" and the earlier confirmed clarification that Authorization does not own an independent Role model.
- **AuthorizationDecision** — `Allow` or `Deny`; the computed, non-persisted output of evaluating a request against this aggregate's grants.

**Responsibilities**
- Own permission definitions and enforce their platform-wide uniqueness.
- Own the set of PermissionGrants (which ResponsibilityReference, within which ContextLevel, holds which Permission).
- Evaluate authorization requests deterministically, producing an AuthorizationDecision.

**Explicitly does not own**
- User identity (Profile Domain).
- Community Position or Committee Role assignment records (Community Domain, Committee Domain) — PermissionPolicy references these via ResponsibilityReference but does not store or manage them.
- Authentication credentials or sessions (Authentication Domain).

**Business Invariants**
- Every PermissionGrant is associated with exactly one ContextLevel.
- Permission names are unique platform-wide.
- No PermissionGrant may reference a User directly; every grant references a ResponsibilityReference.
- Given identical (ContextLevel, ResponsibilityReference, Permission) inputs, the resulting AuthorizationDecision is always the same.
- The default AuthorizationDecision is `Deny` in the absence of a matching PermissionGrant.

### 2.2 Conceptual / Non-Transactional Aggregates

These are explicitly labeled in source as conceptual, observational, or operational-record constructs rather than full transactional aggregates with enforced invariants. They are included here for completeness, but should not be treated as equivalent in rigor to Section 2.1 during implementation planning — each will likely need its own design pass to determine whether it becomes a true aggregate, a read model, or remains a lightweight record.

| Name | Bounded Context | Classification | Source Label | Source Chapter |
|---|---|---|---|---|
| Notification | Notification Domain | Delivery Aggregate | "Notification (Operational Record)" | Ch.31 |
| Metric | Analytics Domain | Analytical Aggregate | "Metric (Conceptual Aggregate)" | Ch.35 |
| AI Capability | Intelligence Domain | AI Aggregate | "AI Capability (Conceptual Aggregate)" | Ch.36 |
| Recommendation | Recommendation Domain | AI Aggregate | "Recommendation (Conceptual Aggregate)" | Ch.37 |

### 2.3 Non-Aggregate Domain Concepts (Referenced for Traceability)

These are named as significant concepts within a bounded context's chapter but are explicitly not aggregates in their own right.

| Concept | Bounded Context | Nature | Source Chapter |
|---|---|---|---|
| Event Lifecycle | Event Management | Finite state machine owned by, and governing, the Event aggregate — not a separate aggregate | Ch.23 |
| Event Workspace | Event Management | Explicitly "a Business Concept, not a User Interface"; a read-side composition over multiple bounded contexts, owns no data of its own | Ch.24 |

### 2.4 Resolution Log

The following decisions were raised as open items during drafting and have been resolved by the project owner. Recorded here for traceability; no further action pending.

| # | Item | Resolution |
|---|---|---|
| 2.4.1 | Sponsor Organization — aggregate or reference? | Remains a referenced business entity, not a separate aggregate. `SponsorshipAgreement` is the sole aggregate root of Sponsorship Domain. A dedicated `SponsorOrganization` aggregate may be introduced later if the platform expands into full sponsor relationship/CRM management — out of scope for the current architecture. |
| 2.4.2 | Team — referenced but never modeled | No `Team` aggregate or bounded context is introduced. `Team` is an internal entity owned by Event Management (Event aggregate); `Enrollment.TeamReference` references it across the bounded context boundary. Team has no independent lifecycle. |
| 2.4.3 | Authorization Domain's aggregate structure was underspecified | Resolved by formalizing `PermissionPolicy` as a full aggregate — see Section 2.1.1. |

---

*End of Section 2 (Approved, Frozen).*

---

## 3. Aggregate → Bounded Context Mapping

**Section status: Approved, Frozen. Amended once — see note below.**

This section groups the aggregates confirmed in Section 2 by their owning bounded context. Every aggregate maps to exactly one bounded context, and every bounded context with Maturity = **Implemented Design** (Section 1.1) owns at least one aggregate — no orphaned aggregates and no Implemented Design context without one. No architectural issues surfaced while building this mapping.

**Amendment:** Content Domain (Section 1.1, #15) was added after this section's original freeze, as a direct consequence of resolving Open Decision 4.16.1. Because Content Domain's Maturity is **Architecturally Approved** rather than **Implemented Design**, it does not yet have an aggregate contract, and the "no orphan context" guarantee above is now scoped explicitly to Implemented Design contexts to remain accurate. Content Domain is listed below with zero aggregates pending detailed domain modeling.

| # | Bounded Context | Aggregates (Classification) | Aggregate Count |
|---|---|---|---|
| 1 | Profile Domain | User (Transactional) | 1 |
| 2 | Authentication Domain | UserCredential (Transactional) | 1 |
| 3 | Authorization Domain | PermissionPolicy (Policy) | 1 |
| 4 | Community Domain | Community (Transactional) | 1 |
| 5 | Event Management | Event (Transactional), Session (Transactional) | 2 |
| 6 | Participation Management | Registration (Transactional), Enrollment (Transactional), Attendance (Transactional), Certificate (Transactional) | 4 |
| 7 | Committee Domain | EventCommittee (Transactional) | 1 |
| 8 | Volunteer Domain | OperationalTask (Transactional) | 1 |
| 9 | Sponsorship Domain | SponsorshipAgreement (Transactional) | 1 |
| 10 | Announcement Domain | Announcement (Transactional) | 1 |
| 11 | Notification Domain | Notification (Delivery) | 1 |
| 12 | Analytics Domain | Metric (Analytical) | 1 |
| 13 | Intelligence Domain | AI Capability (AI) | 1 |
| 14 | Recommendation Domain | Recommendation (AI) | 1 |
| 15 | Content Domain | *(none yet)* | 0 |
| | **Total** | | **18** |

**Notes**
- `Team` is not listed as a separate aggregate — per Section 2.4.2, it is an internal entity owned by the `Event` aggregate within Event Management, not an aggregate in its own right.
- `Event Lifecycle` and `Event Workspace` (Section 2.3) are not aggregates and are intentionally excluded from this mapping; both remain associated with Event Management by ownership.
- Future/Planned bounded contexts (Section 1.2 — Feedback, Search, Administration, Settings, Integration) own no aggregates yet, since none has received detailed domain modeling. They are excluded from this table until they do.
- Content Domain (#15, Architecturally Approved) owns zero aggregates pending detailed domain modeling — see amendment note above. It remains listed here (rather than excluded like the Future/Planned contexts) because it is part of the confirmed inventory (Section 1.1), not the future-candidate list.

---

*End of Section 3 (Approved, Frozen, Amended). Immutable unless the architecture is intentionally redesigned.*

---

## 4. Product Module → Bounded Context Mapping

**Section status: Approved, Frozen.**

Product Modules are the 14 customer-facing business capabilities defined in Chapter 13. This section maps each to the bounded contexts (Section 1.1) that realize it. Unlike Section 3, this mapping is many-to-many by design and was not forced into a clean 1:1 shape.

### 4.0 Relationship Type Definitions

| Relationship Type | Meaning |
|---|---|
| **Primary Owner** | The single bounded context that owns the core aggregate(s) realizing the module's central capability. Each module has at most one Primary Owner — co-equal primary ownership is not used; where a module's scope genuinely spans multiple contexts with no single owner, it is classified as a **Composite Product Experience** instead (see below). |
| **Supporting Context** | Contributes essential capability to the module but does not own the module's core data. |
| **Consumed Service** | The module's primary context relies on this context's output (typically via domain events or read models) as an input, without orchestrating its internal workflow. |
| **Cross-Cutting Capability** | A cross-cutting concern (Section 1.3) that applies to the module's implementation without being a bounded context itself. |

**Composite Product Experience** — a module classification (not a relationship type) for product modules that are not owned by any single bounded context. These modules are realized as CQRS-style read compositions (Section 1.3) spanning multiple contexts, each of which retains sole ownership of its own slice of data. No context is labeled "Primary Owner" for a Composite Product Experience; instead, all contributing contexts are listed flatly, with the structurally anchoring context (if any) noted in the rationale.

### 4.1 Community Management

| Bounded Context | Relationship Type | Rationale |
|---|---|---|
| Community Domain | Primary Owner | Owns community identity, membership, positions, and settings — the core data of this module |
| Committee Domain | Supporting Context | Ch.18 explicitly notes event committee structures "are derived from community memberships and positions"; Committee Domain consumes Community Domain data at the event level |
| Authorization Domain | Supporting Context | Permission grants reference Community Positions via `ResponsibilityReference` (Section 2.1.1) |
| Analytics Domain | Supporting Context | Provides community growth, retention, and engagement metrics (Ch.18, Ch.35 "Community Metrics") |

### 4.2 Event Operations — Composite Product Experience

This module is not assigned a single Primary Owner. Ch.24 explicitly describes the Event Workspace as "a Business Concept, not a User Interface" and a read-side composition — the module's UX is realized through the CQRS pattern (Section 1.3) over several contexts, each retaining ownership of its own data.

| Contributing Bounded Context | Contribution | Rationale |
|---|---|---|
| Event Management | Structural anchor | Ch.24: the Event Workspace is explicitly "Owned By: Event Management Subsystem" — this is the anchoring context the workspace is built around, though it does not own the other contexts' data it composes |
| Committee Domain | Contributing context | Committee executes the event; Event Management does not own committee structure |
| Volunteer Domain | Contributing context | Operational tasks execute the event's planning and execution phases |
| Announcement Domain | Contributing context | Event Workspace surfaces announcements as part of its "Communication" operational area (Ch.24) |
| Analytics Domain | Contributing context (read-only input) | Feeds the Operational Health Panel |
| Recommendation Domain | Contributing context (read-only input) | Feeds AI recommendations surfaced in the workspace |

### 4.3 Registration & Enrollment

| Bounded Context | Relationship Type | Rationale |
|---|---|---|
| Participation Management | Primary Owner | Owns Registration and Enrollment aggregates directly (Ch.26, 27) |
| Notification Domain | Supporting Context | Delivers registration confirmations, approval/rejection notices |
| Analytics Domain | Supporting Context | Registration conversion and trend metrics (Ch.35) |

### 4.4 Volunteer Operations

| Bounded Context | Relationship Type | Rationale |
|---|---|---|
| Volunteer Domain | Primary Owner | Owns OperationalTask, assignments, dependencies, checklists (Ch.33) |
| Committee Domain | Supporting Context | Ch.33: "Every task belongs to one Committee Role" — task ownership is anchored in Committee Domain's role structure |
| Notification Domain | Supporting Context | Delivers task assignment and update notifications |
| Analytics Domain | Supporting Context | Volunteer completion and workload metrics |

### 4.5 Sponsor Relationship Management

| Bounded Context | Relationship Type | Rationale |
|---|---|---|
| Sponsorship Domain | Primary Owner | Owns SponsorshipAgreement, contributions, deliverables (Ch.34) |
| Volunteer Domain | Supporting Context | Ch.34 explicitly names Volunteer Domain as responsible for "execution of deliverables" |
| Announcement Domain | Supporting Context | Ch.34 explicitly names Announcement Aggregate for "sponsor acknowledgements" |
| Analytics Domain | Supporting Context | Sponsor fulfillment and renewal metrics |

### 4.6 Communication & Announcements

| Bounded Context | Relationship Type | Rationale |
|---|---|---|
| Announcement Domain | Primary Owner | Owns "what should be communicated" — content, audience, scheduling (Section 1.1). Treated as the module's primary capability since the module is named and scoped around announcements in Ch.13 |
| Notification Domain | Supporting Context | Owns "how it should be communicated" — delivery, channels, preferences. Supports the Announcement Domain's publication workflow without owning the module's core content |

### 4.7 Attendance & Check-In

| Bounded Context | Relationship Type | Rationale |
|---|---|---|
| Participation Management | Primary Owner | Owns the Attendance aggregate (Ch.28) |
| Analytics Domain | Supporting Context | Attendance rate and completion metrics |

**Note:** Ch.28 explicitly excludes capture technology (QR scanning, NFC, biometrics) from the Attendance aggregate's ownership ("Capture Method Independence"). No bounded context owns the scanning/capture mechanism itself — it is Infrastructure Layer (Ch.39), not a business capability. This is an intentional architectural choice, not a gap.

### 4.8 Certificates & Recognition

| Bounded Context | Relationship Type | Rationale |
|---|---|---|
| Participation Management | Primary Owner | Owns the Certificate aggregate (Ch.29) |
| Notification Domain | Supporting Context | Delivers certificate issuance notifications |
| Analytics Domain | Supporting Context | Certificate issuance metrics |

### 4.9 Media & Documentation

| Bounded Context | Relationship Type | Rationale |
|---|---|---|
| Content Domain | Primary Owner | Newly introduced (Section 1.1, #15) specifically to own media assets, documents, galleries, attachments, event photos, videos, and related content lifecycle management |

**Note:** Content Domain's Maturity is **Architecturally Approved**, not Implemented Design — it has no aggregate contract yet (Section 2, Section 3). This module is mapped but its bounded context still requires detailed domain modeling before implementation.

**Watch item for future domain modeling:** Ch.30 (Announcement Domain) already owns `AnnouncementAttachment` (images, PDFs, external links, documents attached to announcements). Once Content Domain is fully modeled, its relationship to `AnnouncementAttachment` should be clarified — e.g., whether announcement attachments should reference Content Domain assets rather than being a separate embedded concept. Not blocking now since Content Domain has no aggregate contract yet; noted here for when it does.

### 4.10 Analytics & Insights

| Bounded Context | Relationship Type | Rationale |
|---|---|---|
| Analytics Domain | Primary Owner | This module is the direct customer-facing expression of the Analytics Domain (Ch.35) |

### 4.11 AI Operations Assistant

| Bounded Context | Relationship Type | Rationale |
|---|---|---|
| Recommendation Domain | Primary Owner | Owns prioritization, ranking, and surfacing of the actionable recommendations that constitute the module's user-facing capability (Ch.37) |
| Intelligence Domain | Supporting Context | Owns capability orchestration, context assembly, and generation of the underlying insights/predictions/summaries that feed Recommendation Domain (Ch.36) |
| Analytics Domain | Consumed Service | Recommendation Domain and Intelligence Domain consume Analytics as their trusted factual foundation rather than querying operational domains directly |

### 4.12 User Profiles & Professional Identity — Composite Product Experience

This module is not assigned a single Primary Owner. It is best understood as a read-model composition, similar in nature to Event Operations (4.2) — Ch.40 corroborates this directly, listing a "Participant Dashboard" read model that draws on Enrollments, Attendance, Certificates, and Announcements together.

| Contributing Bounded Context | Contribution | Rationale |
|---|---|---|
| Profile Domain | Structural anchor | Owns the core User aggregate — identity, profile, preferences (Ch.19); the base identity the composite view is built around |
| Community Domain | Contributing context | Contributes membership and leadership history to the profile view |
| Participation Management | Contributing context | Contributes event participation and certificate history |
| Volunteer Domain | Contributing context | Contributes volunteer history |

### 4.13 Discovery & Engagement — Composite Product Experience

This module is intentionally not assigned to any single bounded context — it is a user experience composed from multiple contexts, none of which owns "Discovery" itself.

| Contributing Bounded Context | Contribution | Rationale |
|---|---|---|
| Search Domain | Primary supporting context | Owns search and discovery mechanics. **Maturity: Future Candidate (Section 1.2)** — not yet backed by a detailed domain chapter |
| Recommendation Domain | Primary supporting context | Owns the "personalized recommendations" and "trending events" portion of this module (Ch.37) |
| Analytics Domain | Additional supporting context | Engagement and trend metrics inform what surfaces as trending/relevant |
| Profile Domain | Additional supporting context | User interests/history personalize discovery and recommendations |

**Note:** Two of this module's four contributing contexts (Search Domain) are still Future Candidate, not Implemented Design. The module classification itself is resolved — this is a Composite Product Experience by design, not an open question — but its full realization remains dependent on Search Domain eventually receiving detailed domain modeling.

### 4.14 Platform Administration — Deferred

| Bounded Context | Relationship Type | Rationale |
|---|---|---|
| Administration Domain | Primary Owner (deferred) | Remains a Future/Planned bounded context (Section 1.2). The project owner confirmed the domain model should not be invented or expanded at this time — Module 14's implementation waits until Administration Domain receives dedicated domain modeling |
| Authorization Domain | Supporting Context | Permission evaluation for administrative actions, available today |
| Trust, Security & Governance | Cross-Cutting Capability | Audit logs, moderation, and compliance principles (Ch.41) apply to this module's eventual implementation |

This module remains valid in the product architecture; only its bounded-context realization is deferred.

### 4.15 Summary Table

| # | Product Module | Mapping Status | Primary Owner / Contributing Contexts |
|---|---|---|---|
| 1 | Community Management | Single-Owner | Community Domain |
| 2 | Event Operations | Composite Product Experience | Event Management (anchor), Committee, Volunteer, Announcement, Analytics, Recommendation Domain |
| 3 | Registration & Enrollment | Single-Owner | Participation Management |
| 4 | Volunteer Operations | Single-Owner | Volunteer Domain |
| 5 | Sponsor Relationship Management | Single-Owner | Sponsorship Domain |
| 6 | Communication & Announcements | Single-Owner + Supporting | Announcement Domain (primary), Notification Domain (supporting) |
| 7 | Attendance & Check-In | Single-Owner | Participation Management |
| 8 | Certificates & Recognition | Single-Owner | Participation Management |
| 9 | Media & Documentation | Single-Owner (context Architecturally Approved, not yet modeled) | Content Domain |
| 10 | Analytics & Insights | Single-Owner | Analytics Domain |
| 11 | AI Operations Assistant | Single-Owner + Supporting | Recommendation Domain (primary), Intelligence Domain (supporting) |
| 12 | User Profiles & Professional Identity | Composite Product Experience | Profile Domain (anchor), Community, Participation Management, Volunteer |
| 13 | Discovery & Engagement | Composite Product Experience (partially dependent on Future Candidate context) | Search Domain, Recommendation Domain, Analytics, Profile |
| 14 | Platform Administration | Deferred | Administration Domain (Future/Planned) |

All 14 modules are now mapped — either to a single owner, a defined composite of contributing contexts, or explicitly deferred pending future domain modeling. None remain unresolved.

### 4.16 Resolution Log

The following decisions were raised as open items during drafting and have been resolved by the project owner. Recorded here for traceability; no further action pending.

| # | Item | Resolution |
|---|---|---|
| 4.16.1 | Media & Documentation had no owning bounded context | New bounded context **Content Domain** introduced (Section 1.1, #15; Maturity: Architecturally Approved) as the canonical owner of media assets, documents, galleries, attachments, and content lifecycle management. Sections 1 and 3 amended accordingly. |
| 4.16.2 | Discovery & Engagement depended on the unmodeled Search Domain | Confirmed as an intentional **Composite Product Experience**, not a bounded context in its own right. Primary supporting contexts: Search Domain, Recommendation Domain. Additional supporting contexts: Analytics, Profile. No single owning context — by design. |
| 4.16.3 | Platform Administration depended on the unmodeled Administration Domain | Administration Domain remains **Future/Planned** (Section 1.2) — not invented or expanded now. Module 14 remains a valid product module; its bounded-context implementation is explicitly **deferred**. |

| 4.16.4 | Naming: "Recommendation Engine" vs. "Recommendation Domain" | Resolved. Canonical name is **Recommendation Domain** — see Section 1.1 (#14) and Amendment Log 1.1a. Applied consistently throughout this specification. |

---

*End of Section 4 (Approved, Frozen).*

---

## 5. Domain Ownership Matrix

**Section status: Approved, Frozen.**

### 5.0 Scope

This matrix records **authoritative business ownership only** — which single bounded context is the system of record for a given business capability. It intentionally excludes:
- **Data stewardship** (who has a legitimate interest or right in a category of information) — that is Ch.41's concern (see the "Information Stewardship" terminology distinction established during the chapter review), not architectural ownership.
- **User permissions or roles** — governed by the Authorization Domain, not a topic of this matrix.
- **Stakeholder interests** — covered by Ch.9's stakeholder model, not relevant to bounded-context ownership.
- **Implementation responsibilities** (which service, class, or team writes the code) — an engineering/organizational concern, not architecture.

Every capability below is transcribed directly from the "Responsibilities" / "owns" lists in its source chapter, not inferred. Where two chapters claim the same capability, it is flagged as an Open Decision rather than assigned jointly, per project owner direction.

### 5.1 Ownership Matrix

| Bounded Context | Business Capability | Source |
|---|---|---|
| Profile Domain | Personal identity, public profile, avatar, contact information, personal preferences, profile visibility, biography | Ch.19 |
| Authentication Domain | Login/logout, password hashing, password reset, identity verification workflow, session creation/termination, multi-factor authentication, OAuth integration | Ch.20 |
| Authorization Domain | Permission definitions, policy evaluation, context resolution, permission inheritance, authorization decisions, audit of authorization failures | Ch.21, 2.1.1 |
| Community Domain | Community profile & identity, branding, membership management, position (role) definition & assignment, invitations, community settings, organizational memory preservation | Ch.18 |
| Event Management | Event identity/metadata/lifecycle/configuration/classification/visibility/timeline, event ownership, session scheduling/room assignment/resources, Event Workspace composition, Team structure (event-specific) | Ch.22, 23, 24, 25; 2.4.2 |
| Participation Management | Registration policy/configuration, enrollment/participant admission records, attendance verification & recording, certificate eligibility/issuance/verification/revocation | Ch.26, 27, 28, 29 |
| Committee Domain | Event committee structure, committee role definition, event-level role assignment, reporting hierarchy, organizational accountability (event-scoped) | Ch.32 |
| Volunteer Domain | Operational task definition, task assignment, task dependencies, task checklists, operational execution tracking | Ch.33 |
| Sponsorship Domain | Sponsorship agreements, contribution tracking, deliverable definition & fulfillment tracking, sponsor contact/relationship history | Ch.34 |
| Announcement Domain | Announcement content authoring, audience targeting, scheduling, publication state/lifecycle, announcement attachments, revision history | Ch.30 |
| Notification Domain | Delivery orchestration, channel selection, notification preference evaluation, retry logic, delivery status tracking, notification history | Ch.31 |
| Analytics Domain | Metric definitions & calculation, trend generation, dashboard data preparation, analytical consistency | Ch.35 |
| Intelligence Domain | Context assembly, AI capability orchestration, data analysis, pattern detection, feature extraction, prediction, insight generation, summarization, **recommendation signal generation**, model abstraction | Ch.36 + 5.2 resolution — transforms raw data into actionable intelligence and recommendation *signals*; does not own the final user-facing recommendation |
| Recommendation Domain | Signal fusion, recommendation generation (final, user-facing), recommendation ranking/prioritization, recommendation personalization, recommendation explanation, recommendation lifecycle | Ch.37 + 5.2 resolution — consumes insights and recommendation signals from Intelligence Domain and transforms them into the final recommendations delivered to users |
| Content Domain | Media assets, documents, galleries, attachments, event photos/videos, content lifecycle management | Section 1.1 (#15) — full capability breakdown pending detailed domain modeling; Maturity: Architecturally Approved |

### 5.2 Resolution — "Recommendation Generation" Ownership

Ch.36 (Intelligence Domain) and Ch.37 (Recommendation Domain) both listed **"Recommendation generation"** verbatim in their own Responsibilities sections — a literal dual-ownership claim in the source chapters. Resolved by the project owner as follows:

- **Intelligence Domain** owns: data analysis, pattern detection, feature extraction, prediction, insight generation, and **recommendation signal generation**. Its responsibility is to transform raw data into actionable intelligence. It does **not** own the final recommendation presented to users.
- **Recommendation Domain** owns: recommendation generation (final, user-facing), recommendation ranking, recommendation personalization, recommendation explanation, and recommendation lifecycle. It consumes insights and recommendation signals produced by Intelligence Domain and transforms them into the final recommendations delivered to users.

**Amendment note:** The wording "Recommendation generation" in Chapter 36 of the Product Bible is superseded by this specification. Wherever Ch.36 is read going forward, that phrase should be interpreted as **"Recommendation signal generation"** — consistent with the ownership boundary defined above. The Product Bible chapter itself is not edited by this specification; this note governs interpretation only, per the Authority statement at the top of this document.

---

*End of Section 5 (Approved, Frozen).*

---

## 6. Canonical Domain Event Catalog

**Section status: Approved, Frozen.**

### 6.1 Confirmed Domain Events

Only bounded contexts with a formal Aggregate Contract (an explicit "Publishes Domain Events" / "Consumes Domain Events" pair in source) are catalogued here: Community Domain (Ch.18), Event Management (Ch.22/23), Session (Ch.25), Registration (Ch.26), Enrollment (Ch.27), Attendance (Ch.28), Certificate (Ch.29), Announcement (Ch.30), Profile Domain (Ch.19, formalized during Phase 0 implementation — see 6.2.3). This reflects three prior resolutions: `EventStarted` is included in Event Management's published list (Ch.22/23 resolution), `RecognitionApproved` is removed from Certificate's consumed list (Ch.29 resolution — documentation artifact), and Profile Domain's event contract was defined during implementation rather than in Ch.19's original text (6.2.3 resolution).

| Domain Event | Published By | Known Consumer(s) | Source |
|---|---|---|---|
| CommunityCreated | Community Domain | — | Ch.18 |
| MemberJoined | Community Domain | — | Ch.18 |
| MemberRemoved | Community Domain | — | Ch.18 |
| PositionAssigned | Community Domain | — | Ch.18 |
| PositionRemoved | Community Domain | — | Ch.18 |
| InvitationAccepted | Community Domain | — | Ch.18 |
| CommunityOwnershipTransferred | Community Domain | Event Management | Ch.18 (canonical name per 6.2 resolution — supersedes Ch.18's original wording "OwnershipTransferred") |
| EventCreated | Event Management | — | Ch.22 |
| EventPublished | Event Management | Session, Registration | Ch.22, 25, 26 |
| RegistrationOpened | Event Management | Enrollment, Announcement | Ch.22, 27, 30 |
| RegistrationClosed | Event Management | Enrollment, Announcement | Ch.22, 27, 30 |
| EventStarted | Event Management | Announcement | Ch.22/23 (resolution), Ch.30 |
| EventCancelled | Event Management | Registration, Enrollment | Ch.22, 26, 27 |
| EventCompleted | Event Management | Session, Attendance, Certificate, Announcement | Ch.22, 25, 28, 29, 30 |
| EventArchived | Event Management | Session, Registration | Ch.22, 25, 26 |
| SessionCreated | Session (Event Management) | — | Ch.25 |
| SessionUpdated | Session (Event Management) | — | Ch.25 |
| SessionStarted | Session (Event Management) | Attendance | Ch.25, 28 |
| SessionCompleted | Session (Event Management) | Attendance | Ch.25, 28 |
| SessionCancelled | Session (Event Management) | — | Ch.25 |
| SpeakerAssigned | Session (Event Management) | — | Ch.25 |
| RoomChanged | Session (Event Management) | — | Ch.25 |
| RegistrationCreated | Participation Management (Registration) | — | Ch.26 |
| RegistrationUpdated | Participation Management (Registration) | — | Ch.26 |
| CapacityReached | Participation Management (Registration) | — | Ch.26 |
| EnrollmentStarted | Participation Management (Enrollment) | — | Ch.27 |
| EnrollmentSubmitted | Participation Management (Enrollment) | — | Ch.27 |
| EnrollmentApproved | Participation Management (Enrollment) | — | Ch.27 |
| EnrollmentRejected | Participation Management (Enrollment) | — | Ch.27 |
| EnrollmentCancelled | Participation Management (Enrollment) | — | Ch.27 |
| EnrollmentConfirmed | Participation Management (Enrollment) | Attendance | Ch.27, 28 |
| WaitlistPromoted | Participation Management (Enrollment) | — | Ch.27 |
| AttendanceRecorded | Participation Management (Attendance) | — | Ch.28 |
| AttendanceUpdated | Participation Management (Attendance) | — | Ch.28 |
| AttendanceVerified | Participation Management (Attendance) | — | Ch.28 |
| AttendanceCompleted | Participation Management (Attendance) | Certificate | Ch.28, 29 |
| CertificateEligible | Participation Management (Certificate) | — | Ch.29 |
| CertificateIssued | Participation Management (Certificate) | — | Ch.29 |
| CertificateRevoked | Participation Management (Certificate) | — | Ch.29 |
| CertificateRegenerated | Participation Management (Certificate) | — | Ch.29 |
| CertificateVerified | Participation Management (Certificate) | — | Ch.29 |
| AnnouncementCreated | Announcement Domain | — | Ch.30 |
| AnnouncementScheduled | Announcement Domain | — | Ch.30 |
| AnnouncementPublished | Announcement Domain | — | Ch.30 |
| AnnouncementUpdated | Announcement Domain | — | Ch.30 |
| AnnouncementArchived | Announcement Domain | — | Ch.30 |
| ProfileRegistered | Profile Domain | — | Phase 0 implementation (6.2.3 resolution) |
| ProfileUpdated | Profile Domain | — | Phase 0 implementation (6.2.3 resolution) |
| AvatarChanged | Profile Domain | — | Phase 0 implementation (6.2.3 resolution) |
| PreferencesUpdated | Profile Domain | Notification Domain (future — Notification remains Event Modeling Pending; not yet a formal consumer) | Phase 0 implementation (6.2.3 resolution) |
| ProfileVerified | Profile Domain | — | Phase 0 implementation (6.2.3 resolution) |
| ProfileDeactivated | Profile Domain | — | Phase 0 implementation (6.2.3 resolution) |

"Known Consumer(s)" reflects only consumption explicitly stated in another context's own "Consumes Domain Events" list — a blank entry means no other cataloged context declares itself a consumer, not that none exists.

### 6.2 Resolution Log — Cross-Reference Issues

| # | Item | Resolution |
|---|---|---|
| 6.2.1 | Phantom event: `CommunityArchived` (consumed by Event Management, never published by Community Domain) | Removed. No new publisher introduced — community archival is an administrative lifecycle action and does not require Event Management to react through the event bus. Event Management's Consumes list no longer includes this entry. |
| 6.2.2 | Naming mismatch: `CommunityOwnershipTransferred` (Event Management's expectation) vs. `OwnershipTransferred` (Community Domain's Ch.18 wording) | Canonical name is **`CommunityOwnershipTransferred`** — explicit, unambiguous naming is preferred given the event bus is global across bounded contexts. Community Domain's published-events list (6.1) updated accordingly; Ch.18's original wording "OwnershipTransferred" is superseded by this specification, per the Authority statement. |
| 6.2.3 | Profile Domain (Ch.19) formalized as an event publisher during its Phase 0 full-scope implementation, moving it out of §6.3's "Event Modeling Pending" list. Six events defined: `ProfileRegistered` (already implemented at Walking Skeleton time), `ProfileUpdated`, `AvatarChanged`, `PreferencesUpdated`, `ProfileVerified`, `ProfileDeactivated`. `ProfileArchived` was deliberately NOT added — no confirmed cross-context consumer exists yet for the `archive()` lifecycle transition (Constitution Article 37, minimize concepts); the method exists on the aggregate and an event can be added later without rework. | This specification's §6.1 table is the authoritative record; §2.1's aggregate inventory for `User` is unaffected by this change (events are a separate concern from aggregate structure). |

### 6.3 Bounded Contexts Classified as Event Modeling Pending

These contexts have no formal "Publishes/Consumes Domain Events" section in their source chapter — not even an informal list in prose naming specific events. This was first flagged as a structural regression during the original chapter-by-chapter review (Readme7 discussion). Per project owner direction, this catalog records the **current state** rather than speculating about future events: no event names are invented here, and no context is forced to publish something simply for completeness. Some of these contexts will naturally gain published events during future domain modeling; others may permanently remain event consumers or computational contexts that never publish business events of their own.

| Bounded Context | Source Chapter | Status |
|---|---|---|
| Authentication Domain | Ch.20 | Event Modeling Pending |
| Authorization Domain | Ch.21 / 2.1.1 | Event Modeling Pending (including `PermissionGrant` create/revoke, despite `PermissionPolicy` being formalized as a full aggregate in this specification) |
| Committee Domain | Ch.32 | Event Modeling Pending |
| Volunteer Domain | Ch.33 | Event Modeling Pending |
| Sponsorship Domain | Ch.34 | Event Modeling Pending |
| Notification Domain | Ch.31 | Event Modeling Pending — consumers are named in prose (Announcement, Registration, Enrollment, Attendance, Certificate, Community, Authentication), but Notification's own published events are never named |
| Analytics Domain | Ch.35 | Event Modeling Pending |
| Intelligence Domain | Ch.36 | Event Modeling Pending |
| Recommendation Domain | Ch.37 | Event Modeling Pending |
| Content Domain | Section 1.1 (#15) | Event Modeling Pending — not yet domain-modeled at all (Maturity: Architecturally Approved) |

---

*End of Section 6 (Approved, Frozen).*

---

## 7. Canonical Folder Structure

**Section status: Approved, Frozen. Amended once — §7.5 (frontend structure) added; see 7.5.5.**

This section supersedes Chapter 44's example folder structure, which was found during the original review to re-encode the exact over-consolidation errors corrected in Sections 1 and 4 of this specification (a single `operations/` folder for Committee + Volunteer + Sponsorship; a single `intelligence/` folder for Intelligence + Recommendation; a single `identity/` folder for Authentication + Authorization + Profile). The structure below has one folder per bounded context confirmed in Section 1.1 — no exceptions.

### 7.1 Bounded Context → Folder Mapping

**Naming convention (confirmed):** folder names are the bounded context name in concise, lowercase form, with architectural suffixes ("Domain," "Management," "Engine") dropped — those words belong in the architecture documentation, not the filesystem. The folder structure optimizes for developer experience while maintaining a strict one-to-one correspondence with the canonical bounded context inventory (Section 1.1).

| Bounded Context (Section 1.1) | Folder Name |
|---|---|
| Profile Domain | `profile/` |
| Authentication Domain | `authentication/` |
| Authorization Domain | `authorization/` |
| Community Domain | `community/` |
| Event Management | `event/` |
| Participation Management | `participation/` |
| Committee Domain | `committee/` |
| Volunteer Domain | `volunteer/` |
| Sponsorship Domain | `sponsorship/` |
| Announcement Domain | `announcement/` |
| Notification Domain | `notification/` |
| Analytics Domain | `analytics/` |
| Intelligence Domain | `intelligence/` |
| Recommendation Domain | `recommendation/` |
| Content Domain | `content/` |

### 7.2 Canonical Per-Module Internal Structure

Every module folder follows the layered structure defined in Chapter 44's Layer Responsibilities section (Controller / Application Service / Domain / Repository / Infrastructure), applied consistently regardless of module size:

```text
modules/
    <bounded-context>/
        domain/            # Aggregates, Entities, Value Objects, Domain Services, business rules, invariants
        application/       # Application Services — use case orchestration, transaction boundaries, Domain Event publication
        infrastructure/    # Repository implementations, external provider integrations
        api/               # Controllers, request/response DTOs
```

### 7.3 Full Top-Level Structure

```text
modules/
    profile/
    authentication/
    authorization/
    community/
    event/
    participation/
    committee/
    volunteer/
    sponsorship/
    announcement/
    notification/
    analytics/
    intelligence/
    recommendation/
    content/

platform/
    event-bus/              # Domain Events & Event Bus infrastructure (Ch.38) — routing, no business logic
    cqrs/                   # CQRS read-model infrastructure (Ch.40) — projection handlers and composite read models
        event-workspace/         # Composite Product Experience — projects from event/, committee/, volunteer/, announcement/, sponsorship/, analytics/, recommendation/
        user-profile-experience/ # Composite Product Experience — projects from authentication/, authorization/, profile/, participation/, community/
        discovery-engagement/    # Composite Product Experience — projects from search/, recommendation/, analytics/, profile/
    security-governance/    # Trust, Security & Governance cross-cutting concern (Ch.41) — audit logging, compliance utilities
```

`platform/` holds the three items excluded from the Bounded Context Inventory in Section 1.3 — none of them is a business capability with a single accountable domain, so none gets a `modules/` folder.

### 7.4 Composite Product Experiences — Distributed Ownership (Confirmed)

Composite Product Experiences (Section 4: Event Operations, User Profiles & Professional Identity, Discovery & Engagement) do **not** get their own top-level module or directory. Each owning bounded context retains full ownership of its write models, business logic, repositories, and APIs; the composite experience is assembled entirely by the CQRS read layer (`platform/cqrs/`, above) reading published data from the contributing contexts.

| Composite Product Experience | Composed From |
|---|---|
| Event Workspace (Event Operations) | Event, Participation, Announcement, Volunteer, Sponsorship, Analytics, and other contributing contexts |
| User Profile Experience (User Profiles & Professional Identity) | Authentication, Authorization, Profile, Participation, Community, and related contexts |
| Discovery & Engagement | Search, Recommendation, Analytics, Profile |

A dedicated `composite-experiences/` directory was deliberately rejected — introducing a separate module for these would create artificial ownership and blur the bounded-context boundaries this entire specification exists to keep explicit.

### 7.5 Frontend Folder Structure (`apps/web`)

*Added by amendment — see 7.5.5. Sections 7.1–7.4 above govern the backend (`apps/api`); this section governs the frontend.*

The frontend mirrors the backend's explicit-ownership property: each bounded context owns a **feature module**, and nothing outside that module may reach into its internals.

```text
apps/web/
├── app/                          # App Router — routing and page composition ONLY
│   ├── profile/
│   ├── events/
│   └── …
├── features/                     # One module per bounded context
│   └── <canonical-context-name>/
│       ├── api/                  # endpoint declarations for this context
│       ├── components/           # UI owned by this context
│       ├── hooks/                # stateful logic owned by this context
│       ├── types/                # request/response + UI models for this context
│       ├── validation/           # Zod schemas for this context
│       └── index.ts              # PUBLIC INTERFACE — the only import surface
├── lib/                          # Context-agnostic infrastructure
│   ├── api/                      # transport: http, config, error classification
│   └── utils/
├── components/                   # Truly shared UI
│   ├── ui/                       # shadcn primitives
│   ├── layout/
│   └── common/
├── styles/
└── public/
```

#### 7.5.1 Rule 1 — Feature names match canonical context names exactly

`features/*` directory names use the §7.1 names **verbatim** — no aliases, abbreviations, or plurals.

Route segments under `app/` are a **UX concern** and may differ (`/events` may read better than `/event`), but the feature they import from is always the canonical name.

| ✅ Correct | ❌ Incorrect | Why |
|---|---|---|
| `features/authentication/` | `features/auth/` | Abbreviation |
| `features/event/` | `features/events/` | Plural |
| `features/participation/` | `features/registration/` | **Registration is an aggregate inside Participation Management (§2.1), not a bounded context.** A `features/registration/` module would silently reintroduce a boundary this specification explicitly closed |

#### 7.5.2 Rule 2 — `lib/` is strictly infrastructure

`lib/` holds only context-agnostic capability. Anything containing a business concept belongs to its owning feature.

**Test:** if a file cannot be described without naming a bounded context, it does not belong in `lib/`.

| Concern | Home | Reason |
|---|---|---|
| Attaching an auth token to outbound requests | `lib/api/` | Transport mechanics; no business meaning |
| Login form, session hooks, auth state | `features/authentication/` | Knows what a user and a session are |
| HTTP classification, timeouts, result types | `lib/api/` | Applies to every context identically |
| Endpoint declarations for one context | `features/<context>/api/` | Specific to that context's contract |

A `lib/auth/` directory is **prohibited** — it would compete with `features/authentication/` for the same ownership, violating Constitution Article 7.

#### 7.5.3 Rule 3 — Composite Product Experiences live in `app/`

The Composite Product Experiences defined in §4 (Event Workspace, User Profile Experience, Discovery & Engagement) span multiple contexts and, per §7.4, get **no module of their own**.

They are assembled in `app/` by importing each contributing feature's public `index.ts`. A composite page **owns no business logic and establishes no new ownership boundary** — every piece of data remains owned by its contributing context.

This prevents the failure mode where, say, Event Workspace is placed in `features/event/` and quietly acquires ownership of Committee, Volunteer, and Announcement data.

#### 7.5.4 Rule 4 — Type placement splits by responsibility

| Type | Home |
|---|---|
| `ApiResult`, `ApiError`, `ApiErrorKind` — transport primitives | `lib/api/types.ts` |
| Endpoint request/response models (e.g. `ProfileResponse`) | `features/<context>/types/` |
| UI-only view models | `features/<context>/types/` |

#### 7.5.5 Amendment Record

| Trigger | Change |
|---|---|
| Frontend Walking Skeleton architecture review (finding H1 / backlog BL-008) | Added §7.5. Before this amendment the specification defined **only** backend structure; the frontend had grown without a documented convention. Approved by project owner, with all four rules adopted as canonical. The existing Profile implementation was migrated to conform at the same time, so the convention is validated against real code rather than frozen untested. |

---

### 7.6 Future / Planned Bounded Contexts — Reserved, Not Created

Per Section 1.2, these contexts are not yet domain-modeled. No folders are created for them yet; they are listed here only so the eventual namespace is documented and doesn't need to be redebated later.

| Bounded Context (Section 1.2) | Reserved Folder Name | Status |
|---|---|---|
| Feedback Domain | `feedback/` | Not created — Future Candidate |
| Search Domain | `search/` | Not created — Future Candidate |
| Administration Domain | `administration/` | Not created — Future Candidate |
| Settings Domain | `settings/` | Not created — Future Candidate |
| Integration Domain | `integration/` | Not created — Future Candidate |

---

*End of Section 7 (Approved, Frozen).*

---

## 8. Terminology Glossary

**Section status: Approved, Frozen.**

### 8.1 Architectural Concepts

| Term | Definition |
|---|---|
| **Bounded Context** | An internal implementation boundary owning a business capability's data model, business rules, and consistency guarantees. Confirmed inventory in Section 1.1. Not the same as a Product Module (below). |
| **Product Module** | A customer-facing business capability (the 14 defined in Ch.13). May be realized by one bounded context, by a Primary + Supporting pair, or by a Composite Product Experience. Section 4. |
| **Aggregate / Aggregate Root** | A DDD consistency boundary within a bounded context; the root entity through which all changes to the aggregate's owned data must pass. Canonical inventory in Section 2. |
| **Composite Product Experience** | A product module classification (Section 4.0) for modules with no single owning bounded context — realized as a CQRS read composition over multiple contexts, each retaining sole ownership of its own data. Does not get its own module/folder (Section 7.4). Applies to: Event Operations, User Profiles & Professional Identity, Discovery & Engagement. |
| **Domain Event** | An immutable record of a business fact that has already occurred, published by the owning aggregate/context, consumed by any number of independent subscribers (Ch.38). Catalog in Section 6. |
| **Integration Event** | Communication leaving EventSphere to an external system (e.g., `SendEmail`, `SyncCRM`) — distinct from a Domain Event, which is internal (Ch.38). |
| **CQRS / Read Model** | Architectural pattern (Ch.40) separating authoritative write models (aggregates) from optimized, disposable read projections. The mechanism by which Composite Product Experiences are assembled (Section 7.3–7.4). |

### 8.2 Maturity & Classification Vocabulary

| Term | Definition | Established In |
|---|---|---|
| **Implemented Design** | Bounded context maturity: backed by a full detailed domain chapter (aggregate contract, invariants, business rules). | Section 1.1 |
| **Architecturally Approved** | Bounded context maturity: confirmed as canonical by the project owner, but not yet backed by a detailed domain chapter or full aggregate contract. Currently applies only to Content Domain. | Section 1.1, 1.1a |
| **Future Candidate** | Bounded context maturity: referenced in summary material or discussion, but not yet confirmed or domain-modeled. | Section 1.2 |
| **Event Modeling Pending** | Status for a confirmed bounded context that has no formally defined domain events yet. Distinct from "Future Candidate" — the context itself is confirmed; only its event contract is outstanding. | Section 6.3 |
| **Transactional Aggregate** | Aggregate classification: enforces full transactional consistency and business invariants (e.g., Event, Registration, Enrollment). | Section 2.1 |
| **Policy Aggregate** | Aggregate classification: owns rule/policy definitions evaluated on demand rather than a transactional business record (e.g., PermissionPolicy). | Section 2.1.1 |
| **Analytical Aggregate** | Aggregate classification: conceptual, observational — computes derived facts rather than owning primary business state (e.g., Metric). | Section 2.2 |
| **AI Aggregate** | Aggregate classification: conceptual — represents AI-generated capability/output rather than a persisted transactional record (e.g., AI Capability, Recommendation). | Section 2.2 |
| **Delivery Aggregate** | Aggregate classification: represents an operational record of an infrastructure-facing delivery process rather than a core business fact (e.g., Notification). | Section 2.2 |
| **Primary Owner** | Relationship type: the single bounded context owning the core aggregate(s) realizing a product module's central capability. At most one per module (Composite Product Experiences excepted). | Section 4.0 |
| **Supporting Context** | Relationship type: contributes essential capability to a module without owning its core data. | Section 4.0 |
| **Consumed Service** | Relationship type: a module's primary context relies on another context's output (via events/read models) as input, without orchestrating its workflow. | Section 4.0 |
| **Cross-Cutting Capability** | Relationship type: a cross-cutting concern (Section 1.3) applying to a module's implementation without being a bounded context. | Section 4.0 |

### 8.3 Resolved Business Terminology (Disambiguations)

These terms were sources of genuine ambiguity or conflicting usage across the Product Bible chapters. Each row records the canonical resolution and why it matters.

| Term(s) | Resolution |
|---|---|
| **Role vs. Position** | Community Position (Community Domain, Ch.18) is the authoritative, persisted business entity for community-level leadership responsibilities. Authorization Domain does not own an independent "Role" model — where the term "Role" appears in Authorization contexts, it refers to a transient evaluation construct, not a stored entity. Effective permissions are derived from Community Positions, Committee Roles (event-scoped, Ch.32), and Platform Administrator designations via `ResponsibilityReference` (Section 2.1.1). |
| **Community Position vs. Committee Role** | Community Position (Community Domain) is a long-lived, community-scoped leadership responsibility. Committee Role (Committee Domain, Ch.32) is a temporary, event-scoped operational responsibility. They are distinct entities in distinct bounded contexts, not the same concept at different scopes. |
| **Data Ownership vs. Data/Information Stewardship** | "Architectural ownership" (this specification, especially Section 5) means the single bounded context that is the authoritative system of record for a capability — always singular. "Data Stewardship" (or "Information Governance," per the pending Ch.41 rename) describes which parties have a legitimate interest, right, or responsibility regarding a category of information (e.g., a sponsorship agreement is jointly stewarded by a Community and a Sponsor) — this can be plural and is a governance concept, not an architectural one. Section 5.0 explicitly excludes stewardship from the Ownership Matrix. |
| **Registration vs. Enrollment** | Registration (Participation Management) governs the *application process* — policy, forms, eligibility rules, capacity, approval strategy. Enrollment (Participation Management) governs the *post-registration decision lifecycle* — one participant's application, responses, approval state, confirmation, waitlist status. Registration defines the rules; Enrollment records one participant's journey through them. |
| **Announcement vs. Notification** | Announcement Domain owns "what should be communicated" — content, audience, scheduling, publication lifecycle. Notification Domain owns "how it should be communicated" — delivery channels, retry policy, delivery status, preferences. Deliberately kept as two separate bounded contexts (Section 1.1) despite both serving the same Communication & Announcements product module (Section 4.6, where Announcement is Primary and Notification is Supporting). |
| **Intelligence vs. Recommendation** | Intelligence Domain transforms raw data into actionable intelligence: data analysis, pattern detection, feature extraction, prediction, insight generation, and **recommendation signal generation**. It does not own the final, user-facing recommendation. Recommendation Domain consumes those insights/signals and owns recommendation generation, ranking, personalization, explanation, and lifecycle — the final recommendation delivered to users. Resolved in Section 5.2; supersedes Ch.36's original "Recommendation generation" wording, which should now be read as "Recommendation signal generation." |
| **Recommendation Domain (canonical name)** | Ch.37 self-declares "Recommendation Engine." Canonical name in this specification is **Recommendation Domain** — "Engine" describes an implementation concept; "Domain" describes the business capability/bounded context, consistent with the naming pattern used by the other 14 confirmed contexts. See Section 1.1a. |
| **Profile Domain (canonical name)** | Ch.19 self-declares "User Domain"; an earlier review round used "User Profile Domain." Canonical name is **Profile Domain**. See Section 1.1. |
| **Team** | Not an independent aggregate or bounded context. An internal entity owned by the `Event` aggregate within Event Management; `Enrollment.TeamReference` references it across the bounded-context boundary. No independent lifecycle. See Section 2.4.2. |
| **Sponsor Organization** | Not an independent aggregate. Remains a referenced business entity within Sponsorship Domain; `SponsorshipAgreement` is the sole aggregate root of Sponsorship Domain. A dedicated `SponsorOrganization` aggregate may be introduced later only if the platform expands into full sponsor CRM management. See Section 2.4.1. |
| **PermissionPolicy** | Formalized in this specification (Section 2.1.1) as the Authorization Domain's aggregate root, since Ch.21 described the domain narratively without a formal aggregate contract. Owns Permission and PermissionGrant; explicitly does not own User identity, Community Positions, Committee Roles, or Authentication credentials — only references them via `ResponsibilityReference`. |
| **Content Domain** | Newly introduced bounded context (Section 1.1, #15; Maturity: Architecturally Approved) to own media assets, documents, galleries, attachments, and content lifecycle management — resolving the previously unowned Media & Documentation product module (Ch.13, Module 9). No detailed domain chapter exists yet. |
| **Ubiquitous Language** | Per Ch.17: terms should carry one consistent meaning across product documentation, database schema, API specifications, and implementation. This glossary is the canonical enforcement point for that principle going forward — where a Product Bible chapter's wording conflicts with a resolution recorded here, this specification is authoritative (see Authority statement, top of document). |
| **Canonical Architecture Specification** | This document. The authoritative technical reference for EventSphere. It supersedes architectural summary chapters whenever conflicts arise. Detailed domain chapters remain the authoritative source for business behavior unless explicitly amended by this specification. All implementation work, engineering decisions, documentation updates, and AI-generated code should treat this specification as the primary architectural reference. |

---

*End of Section 8 (Approved, Frozen).*

---

## Document Status

| Property | Value |
|---|---|
| **Document Status** | Approved |
| **Version** | 1.0 |
| **Status** | Canonical |
| **Purpose** | Single Source of Truth |
| **Supersedes** | Architectural summary artifacts where conflicts exist |
| **Next Phase** | Implementation Planning |

**The Canonical Architecture Specification v1.0 is complete.** All eight sections (Bounded Context Inventory, Aggregate Inventory, Aggregate → Bounded Context Mapping, Product Module → Bounded Context Mapping, Domain Ownership Matrix, Domain Event Catalog, Canonical Folder Structure, Terminology Glossary) are approved and frozen, with all amendments recorded in place via their respective amendment/resolution logs.
