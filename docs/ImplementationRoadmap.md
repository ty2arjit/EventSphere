# EventSphere — Implementation Roadmap

**Status:** Living document. Sections are approved incrementally, following the same review discipline used for the Canonical Architecture Specification.

**Authority:** This roadmap converts the Canonical Architecture Specification (v1.0) into sequenced, incremental delivery milestones. It does not redefine architecture. Where a scoping decision requires a deviation from the frozen Specification (e.g., a reduced aggregate scope for MVP), that deviation is recorded explicitly as a scoped exception, not a silent change — consistent with the amendment/resolution-log discipline used throughout the Specification.

**Document Hierarchy** (per project owner directive):
1. Canonical Architecture Specification — Primary Technical Reference
2. AI Engineering Constitution — Engineering Rules & Cognitive Protocol
3. System Design Bible (Readme1–10) — Business Vision & Architectural Rationale

This roadmap operates *underneath* all three — it sequences work, it does not reinterpret architecture.

---

## 0. MVP v1 — Confirmed Scope

### 0.1 In Scope

| Product Module | Bounded Context(s) | Scope Note |
|---|---|---|
| — (foundation) | Profile Domain | Full scope per Ch.19 |
| — (foundation) | Authentication Domain | Full scope per Ch.20 |
| — (foundation) | Authorization Domain | Full scope per Ch.21 / Section 2.1.1 |
| Community Management | Community Domain | Full scope per Ch.18 |
| Event Operations | Event Management | Full scope per Ch.22–25, including Event Workspace (Composite Product Experience) |
| — (supports Volunteer Operations) | **Committee Domain — MVP-scoped** | **Reduced scope.** Supports only: Committee creation, Committee roles, Role assignments. Reporting Hierarchy (optional per Ch.32) deferred — see 0.3. |
| Registration & Enrollment | Participation Management (Registration, Enrollment aggregates) | Full scope per Ch.26–27 |
| Attendance & Check-In | Participation Management (Attendance aggregate) | Full scope per Ch.28 |
| Certificates & Recognition | Participation Management (Certificate aggregate) | Full scope per Ch.29 |
| Communication & Announcements | Announcement Domain, Notification Domain | Full scope per Ch.30–31 |
| Volunteer Operations | Volunteer Domain | Full scope per Ch.33, dependent on MVP-scoped Committee Domain |
| Analytics & Insights | Analytics Domain | Full scope per Ch.35, coverage limited by which contexts are in MVP (see 0.3) |
| AI Operations Assistant | **Intelligence Domain + Recommendation Domain — reduced scope ("AI Assistant v0.1")** | **Reduced scope.** See 0.2. |

### 0.2 AI Assistant v0.1 — Explicit Scope Boundary

In scope:
- Event summaries
- Registration insights
- Attendance insights
- Analytics-based recommendations
- Natural-language interaction with existing analytics

Explicitly out of scope for v0.1:
- Autonomous actions of any kind
- Workflow automation
- Advanced agent capabilities (multi-step planning, tool use beyond querying Analytics)

Purpose: validate product value while allowing Intelligence Domain and Recommendation Domain to mature incrementally, consistent with their current Maturity status (Section 2.2 of the Specification — both are Conceptual Aggregates with no cataloged domain events yet, Section 6.3).

### 0.3 Deferred (Out of MVP v1)

| Product Module | Bounded Context(s) | Note |
|---|---|---|
| Committee Management (full) | Committee Domain (full scope, including Reporting Hierarchy) | MVP ships a minimal slice only — see 0.1 |
| Sponsor Relationship Management | Sponsorship Domain | Fully deferred |
| User Profiles & Professional Identity | Composite Product Experience | Fully deferred |
| Media & Documentation | Content Domain | Fully deferred — context is Architecturally Approved only, no aggregate contract |
| Discovery & Engagement | Composite Product Experience | Fully deferred — partly depends on unmodeled Search Domain |
| Platform Administration | Administration Domain | **Explicitly the first planned post-MVP bounded context.** Not modeled during this roadmap — no architecture will be invented for it during implementation planning, per Constitution Article 8. |

**Consequence for Analytics & Insights:** Ch.35 states Analytics consumes from Committee Domain and Sponsorship Domain, among others. Since Sponsorship Domain is fully deferred and Committee Domain is MVP-scoped down, Analytics' metric coverage in v1 will exclude Sponsorship Metrics entirely and will have only partial Committee-related data (whatever the MVP-scoped Committee Domain produces). This is a graceful-degradation consequence of the scope decisions above, not a defect — noted here for traceability.

---

## 1. Dependency Graph & Build-Order Phases

**Section status: Draft — pending review.**

Every dependency below is transcribed from the "Depends On" field of each aggregate/domain's source chapter (Ch.18–37) or the Canonical Architecture Specification — not inferred. This determines the only valid build order: a context cannot be meaningfully implemented (beyond scaffolding) before everything in its "Depends On" list exists.

### 1.1 Raw Dependency Table

| Bounded Context | Depends On | Source |
|---|---|---|
| Profile Domain | None | Ch.19 |
| Authentication Domain | Profile Domain (User Aggregate) | Ch.20 |
| Community Domain | Profile Domain (User Aggregate, for CommunityMember) | Ch.18 |
| Authorization Domain | Profile Domain, Community Domain, Event Management | Ch.21 |
| Event Management | Community Domain (Community Aggregate) | Ch.22 |
| Committee Domain (MVP-scoped) | Event Management, Community Domain, Profile Domain | Ch.32 |
| Participation Management — Registration | Event Management | Ch.26 |
| Participation Management — Enrollment | Registration, Profile Domain, Event Management | Ch.27 |
| Participation Management — Attendance | Enrollment, Event Management (Session Aggregate) | Ch.28 |
| Participation Management — Certificate | Attendance, Event Management, Enrollment | Ch.29 |
| Volunteer Domain | Committee Domain, Event Management, Profile Domain | Ch.33 |
| Announcement Domain | Community Domain, Event Management | Ch.30 |
| Notification Domain | Profile Domain, Announcement Domain, Authorization Domain | Ch.31 |
| Analytics Domain | Every operational domain in scope (Community, Event Management, Participation Management, Committee, Volunteer, Announcement) | Ch.35 |
| Intelligence Domain | Analytics Domain, Authorization Domain | Ch.36 |
| Recommendation Domain | Intelligence Domain, Analytics Domain, operational domains | Ch.37 |

### 1.2 Build-Order Phases

Five phases, each gated by the previous phase's dependencies being satisfied. Within a phase, contexts are generated in Constitution Article 36 order (Business Model → Aggregate → Repository Interface → Application Service → Controller → DTO → Frontend).

#### Phase 0 — Foundation
- **Profile Domain** (no dependencies — first thing built)
- **Authentication Domain** (needs Profile)
- **Community Domain** (needs Profile)
- **Authorization Domain — Core Engine only.** `PermissionPolicy`, `Permission`, `PermissionGrant`, evaluation logic (Section 2.1.1) can be built now with `ResponsibilityReference` as an opaque identifier. Full integration (wiring real Community Positions and Committee Roles into `ResponsibilityReference`) is deferred to Phase 1, since Committee Domain doesn't exist yet.

#### Phase 1 — Core Event Lifecycle
- **Event Management** (Event + Session aggregates, Event Lifecycle FSM) — needs Community
- **Committee Domain (MVP-scoped)** — needs Event, Community, Profile
- **Authorization Domain — Full Integration** — wire `ResponsibilityReference` to real Community Positions and Committee Roles now that both exist
- **Registration Aggregate** (Participation Management) — needs Event

#### Phase 2 — Participation & Operations
- **Enrollment Aggregate** — needs Registration, Profile, Event
- **Attendance Aggregate** — needs Enrollment, Session
- **Certificate Aggregate** — needs Attendance, Event, Enrollment
- **Volunteer Domain** — needs Committee, Event, Profile

#### Phase 3 — Communication & Composite Experience
- **Announcement Domain** — needs Community, Event
- **Notification Domain** — needs Profile, Announcement, Authorization (full)
- **Event Workspace assembly** (CQRS composite, Section 7.4) — this is the point at which Event Workspace can be meaningfully composed, since its contributing contexts (Event, Committee, Volunteer, Announcement) all now exist. Analytics and Recommendation contributions to the workspace land in Phase 4 and are added incrementally.

#### Phase 4 — Intelligence Layer
- **Analytics Domain** — needs Community, Event, Participation Management, Committee, Volunteer, Announcement all producing domain events (built incrementally as each upstream context lands, not as a single big-bang integration)
- **Intelligence Domain (v0.1 scope)** — needs Analytics, Authorization
- **Recommendation Domain (v0.1 scope — "AI Assistant v0.1")** — needs Intelligence, Analytics
- Event Workspace's Analytics/Recommendation contributions completed

### 1.3 Notes on This Ordering

- Phase 0 and Phase 1 both touch Authorization Domain (core, then full integration) rather than building it once — this is intentional and reflects a genuine dependency ordering constraint (Ch.21 depends on Community and Event, which don't exist until Phase 1), not a planning artifact to be "fixed."
- Analytics Domain (Phase 4) is described as built "incrementally" rather than as one milestone — per Ch.35's own design ("Analytics observes; it does not own"), each upstream context can begin publishing events that Analytics consumes as soon as that context lands, rather than waiting for all of Phase 0–3 to fully complete before starting Analytics work.
- Platform Administration does not appear in this dependency graph at all — per your direction, it is treated as the first planned post-MVP bounded context and is intentionally out of scope for this roadmap.

---

*End of Section 1 (Draft). Superseded framing below — Section 2 now defines the concrete build order.*

---

## 2. Implementation Flow — Detailed Build Order

**Section status: Draft — pending review.**

### 2.0 Per-Context Build Sequence (applies to every bounded context below)

Per `SystemDesign.md`'s Implementation Philosophy and Constitution Article 36, every bounded context is built through these layers, in order, before moving to the next context:

1. **Domain** — Aggregates, Entities, Value Objects, Domain Services, invariants
2. **Repository** — interface in Domain layer, Prisma implementation in Infrastructure
3. **Application Service** — one per use case (Constitution Article 24 — no God Services)
4. **Controller + Routes**
5. **DTO + Mapper + Validators**
6. **API wiring** — versioned `/api/v1/...`
7. **Frontend** — Next.js pages/components consuming the API
8. **Testing** — aggregate tests, application service tests, integration tests (Ch.45)

This is "layer by layer" applied at the finest useful grain — once per context, not once across all 15 contexts. It also means every context reaching step 7 produces something demonstrably working, not just backend scaffolding.

### 2.1 Step 0 — Walking Skeleton (before Phase 0 proper begins)

Build one minimal end-to-end slice through the full stack, on real deployed infrastructure, before starting any other context work:

- Minimal Profile slice (User aggregate: id, email, name)
- Repository → Prisma → Neon PostgreSQL
- One Application Service (e.g., `RegisterProfileService`)
- One Controller/Route: `POST /api/v1/profile`
- One Next.js page calling that route and rendering the result
- Deployed: Vercel (frontend) + Railway/Render (backend) + Neon (database) — real URLs, not just localhost

**Exit criteria:** a request travels Next.js → Express → Application Service → Domain → Prisma → PostgreSQL → response → rendered UI, on deployed infrastructure. This proves the architecture wires together correctly before scaling to 15 bounded contexts, and surfaces any deployment/tooling problems while the blast radius is still one aggregate.

### 2.2 Phase 0 — Foundation (full scope)

1. **Profile Domain** (complete Ch.19 scope, extending the walking skeleton)
2. **Authentication Domain** (JWT access/refresh tokens, HTTP-only cookies, login/logout, password reset, email verification)
3. **Community Domain** (Community, CommunityMember, CommunityPosition, CommunityInvitation, CommunitySettings)
4. **Authorization Domain — Core Engine** (`PermissionPolicy`, `Permission`, `PermissionGrant`, evaluation logic — `ResponsibilityReference` as an opaque identifier for now)

### 2.3 Phase 1 — Core Event Lifecycle

5. **Event Management** (Event aggregate + Event Lifecycle FSM, Session aggregate)
6. **Committee Domain — MVP-scoped** (Committee, CommitteeRole, RoleAssignment only — Reporting Hierarchy deferred)
7. **Authorization Domain — Full Integration** (wire `ResponsibilityReference` to real Community Positions and Committee Roles now that both exist)
8. **Registration Aggregate**

### 2.4 Phase 2 — Participation & Operations

9. **Enrollment Aggregate**
10. **Attendance Aggregate**
11. **Certificate Aggregate**
12. **Volunteer Domain** (OperationalTask, TaskAssignment, TaskDependency, TaskChecklist)

### 2.5 Phase 3 — Communication & Composite Experience

13. **Announcement Domain** (including Cloudinary/S3 integration for `AnnouncementAttachment`)
14. **Notification Domain** (email/push provider integration, delivery tracking)
15. **Event Workspace CQRS assembly — partial** (composing Event, Committee, Volunteer, Announcement contributions; Analytics/Recommendation contributions land in Phase 4)

### 2.6 Phase 4 — Intelligence Layer

16. **Analytics Domain** — *not strictly sequential*: since Analytics is purely event-driven and read-only, event-consumer code for each upstream context can be written incrementally as soon as that context lands (as early as Phase 1), rather than waiting for Phase 4 to start. Full coverage completes here once every contributing context exists.
17. **Intelligence Domain (v0.1 scope)**
18. **Recommendation Domain (v0.1 scope) — AI Assistant v0.1** (Gemini API integration; event summaries, registration insights, attendance insights, analytics-based recommendations, NL interaction with analytics — no autonomous actions)
19. **Event Workspace — complete** (Analytics and Recommendation contributions added)

---

*End of Section 2 (Approved, Frozen).*

---

## 3. Exit Criteria & Definition of Done

**Section status: Draft — pending review.**

This section applies Constitution Articles 41 (Mandatory Quality Gates) and 42 (Definition of Done) concretely to each milestone from Section 2, rather than restating them abstractly. A milestone is not complete until every item in its checklist is checked.

**Recurring item across milestones:** several bounded contexts are marked **Event Modeling Pending** in the Canonical Architecture Specification (Section 6.3) — they have no domain events defined yet because no chapter specified them. As each such context is actually implemented, real domain events must be defined (per Constitution Article 17 — facts, not commands) and the Specification's Domain Event Catalog (Section 6) updated accordingly. This is called out explicitly per milestone below rather than left implicit.

---

### 3.1 Walking Skeleton

**STATUS: ✅ COMPLETE — deployed and verified end-to-end** (2026-08-06). Backend and frontend both frozen following structured architecture reviews; deployed to Railway/Vercel/Neon; the previously-deferred browser → Neon confirmation is now closed. Freeze records: 3.1.1 (backend), 3.1.2 (frontend).

**Objectives:** Prove the full stack wires together correctly, on real deployed infrastructure, before committing to the 19-item build order.

**Deliverables:**
- Minimal `User` aggregate (id, email, name only — not full Ch.19 scope)
- `ProfileRepository` interface (Domain) + Prisma implementation (Infrastructure)
- One Application Service (e.g. `RegisterProfileService`)
- One Controller + Route: `POST /api/v1/profile`
- One Next.js page calling that route and rendering the result
- Deployed: Vercel (frontend) + Railway/Render (backend) + Neon PostgreSQL (database)

**Dependencies:** None — this is the first thing built.

**Quality Gates:**
- [x] Domain layer has zero imports of Prisma, Express, or any frontend library (Constitution Article 11)
- [x] Repository is the only code that calls Prisma (Article 16, 22)
- [x] Controller contains no business logic, only request translation (Article 15)
- [x] No `any` types used without explicit approval (Article 27)
- [x] At least one Domain unit test and one integration test (hitting the real deployed endpoint) exist

**Acceptance Criteria:** A request made against the **deployed** frontend URL creates a real row in the **deployed** Postgres database, and the created profile renders on screen — proving Next.js → Express → Application Service → Domain → Repository → Prisma → PostgreSQL → response → UI all connect correctly in production, not just localhost.

**✅ MET — verified 2026-08-06.** Live browser test against `https://event-sphere-web.vercel.app/profile`: form submission fetched `https://eventsphere-production-4554.up.railway.app/api/v1/profile`, returned `201`, and the UI rendered "Profile registered" with a persisted `id`, `name`, `email`, and `createdAt`. No CORS errors. This closes both items deferred in 3.1.2 (browser → Neon; deployed-infrastructure acceptance criteria) in a single check, since `/ready` had already confirmed Railway ↔ Neon connectivity.

**Definition of Done:** All Quality Gates checked, acceptance criteria demonstrated end-to-end on deployed infrastructure, code reviewed against Constitution Articles 11–16 and 21–22. **Met — Walking Skeleton complete.** Phase 0 may now begin.

---

#### 3.1.1 Backend Portion — Freeze Record

**Status: FROZEN.** Approved by the project owner after a structured architecture review against all four governing documents.

**Verification evidence at time of freeze:**

| Check | Result |
|---|---|
| Unit + API tests | 25/25 passing (no infrastructure required) |
| Integration tests | 3/3 passing against live Neon PostgreSQL |
| End-to-end (HTTP → Domain → Prisma → Neon) | `201`; row confirmed present in database; returned ID matches persisted row |
| Domain event | `ProfileRegistered` published after persistence, carrying all Constitution Article 18 metadata |
| Duplicate-email path | `409 EMAIL_ALREADY_REGISTERED` — confirms domain `kind` → HTTP status mapping works without the domain knowing HTTP |
| Type-check | Clean; zero `any` (Article 27) |
| Layer boundaries | Domain framework-free; Prisma confined to 2 infrastructure files; Express confined to 5 outer-layer files |

**Quality Gates (Section 3.1) — all met:**
- [x] Domain layer has zero imports of Prisma, Express, or any frontend library
- [x] Repository is the only code that calls Prisma
- [x] Controller contains no business logic, only request translation
- [x] No `any` types used
- [x] Domain unit tests and integration tests exist and pass

**Review findings resolved before freeze:** C1 (CORS configured with explicit origin allow-list and credentials support), H1 (HTTP status codes removed from the Domain layer in favour of transport-agnostic error `kind`s mapped centrally), H2 (in-process Domain Event mechanism implemented and validated), M2 (concurrency race-condition test added).

**Findings deferred with documented rationale:** M1 (email normalization / `Email` Value Object) and M3 (account enumeration) recorded as BL-001 and BL-002 in `TECHNICAL_BACKLOG.md`, along with BL-003 through BL-007.

**Freeze scope:** the backend vertical slice only. Changes to frozen backend code now require the same explicit-approval discipline applied to architecture documents — raise the issue rather than modifying it silently.

**Remaining for full Walking Skeleton completion:** frontend slice, and deployment to Vercel + Railway/Render (the Section 3.1 acceptance criteria explicitly require deployed infrastructure, not localhost).

---

#### 3.1.2 Frontend Portion — Freeze Record

**Status: FROZEN.** Approved by the project owner after a structured architecture review against all four governing documents. Review conclusion: **⚠️ Approved with Minor Improvements** — no finding required changes before freeze.

**Delivered across 10 sequenced steps**, each individually reviewed and approved:

| Step | Delivered |
|---|---|
| 1 | Project setup — Next.js 16 / Tailwind v4 / shadcn on Base UI; fixed workspace-root misdetection and `.env*.example` tracking |
| 2 | Typed API client — centralised transport, discriminated-union results, classified errors, timeout |
| 3 | `/profile` Server Component page shell |
| 4 | `ProfileRegistrationForm` client boundary with React Hook Form |
| 5 | Zod validation, verified at **parity with backend domain rules (0/12 mismatches)** |
| 6 | API integration incl. first real **CORS preflight** verification |
| 7 | Loading / success / error states with centralised error-code → copy mapping |
| 8 | End-to-end — browser → API → backend verified; browser → Neon **deferred** |
| 9 | Architecture review |
| 10 | Freeze |

**Verification evidence at time of freeze:**

| Check | Result |
|---|---|
| Frontend tests | 51/51 passing |
| Type-check / lint / production build | Clean / clean / passing |
| Server vs Client boundary | Only `ProfileRegistrationForm.tsx` is `'use client'`; `/profile` still builds as `○ (Static)` |
| Dependency direction | Acyclic, inward-only; `lib/` never imports `app/` |
| Framework independence | `lib/api` and `lib/validation` import zero React/Next |
| Constitution | Zero violations (Articles 11, 21, 22, 23, 27, 28, 29, 37, 6 all verified) |
| Security | No `dangerouslySetInnerHTML`; React escaping intact; only `NEXT_PUBLIC_*` env access; raw backend messages never rendered |
| Client/server validation parity | 12 inputs, 0 mismatches |
| CORS preflight | `OPTIONS → 204` from a real browser |

**Findings recorded, none blocking the freeze:** BL-008 (frontend folder convention — **blocks Phase 0**), BL-009 (component tests), BL-010 (request cancellation), BL-011 (i18n decision), BL-012 (timestamp formatting), BL-013 (formatter).

**Deferred infrastructure confirmation — browser → Neon. RESOLVED 2026-08-06.** The final assertion in Section 3.1's acceptance criteria (a browser-originated request creating a row in the deployed database) was outstanding because the available network blocked outbound port 5432. It is now closed: see the verification evidence recorded in Section 3.1 above (deployed Vercel frontend → deployed Railway backend → Neon, full round trip, `201` + rendered UI).

**Deployment — RESOLVED 2026-08-06.** Frontend deployed to Vercel (`https://event-sphere-web.vercel.app`), backend deployed to Railway (`https://eventsphere-production-4554.up.railway.app`), database on Neon. `NEXT_PUBLIC_API_URL` and `CORS_ORIGINS` correctly configured after two redeploy iterations (first attempt served a stale build without the env var inlined). Walking Skeleton is now fully complete on deployed infrastructure, closing out Section 3.1 entirely.

---

### 3.2 Phase 0 — Foundation

**Objectives:** Deliver Profile, Authentication, Community, and Authorization (core engine) as complete, independently working bounded contexts.

**Deliverables:**
- **Profile Domain** — full Ch.19 scope (UserProfile, UserPreferences, avatar, bio, headline, institution, etc.)
- **Authentication Domain** — registration, login, logout, JWT issuance/refresh, password reset, email verification, secure password hashing
- **Community Domain** — Community CRUD, CommunityMember join/leave, CommunityPosition CRUD, CommunityInvitation flow, CommunitySettings
- **Authorization Domain (core engine)** — `PermissionPolicy` aggregate, `Permission` CRUD, `PermissionGrant` CRUD with `ResponsibilityReference` as an opaque identifier, deterministic Allow/Deny evaluation service (Section 2.1.1)
- **Event modeling for Profile, Authentication, Authorization** (all three are Event Modeling Pending per Specification Section 6.3) — define real domain events as these contexts are implemented (e.g. events needed for cross-context reactions like email-change or credential updates) and update Specification Section 6 accordingly. Community Domain's events are already cataloged (`CommunityCreated`, `MemberJoined`, `MemberRemoved`, `PositionAssigned`, `PositionRemoved`, `InvitationAccepted`, `CommunityOwnershipTransferred`) — implement exactly as cataloged, no deviation.

**Dependencies:** Walking Skeleton complete.

**Quality Gates:**
- [ ] Business: Profile's "Unique Email" and "Immutable Identity" invariants enforced; Authentication's "One Credential Record Per User" and password-security invariants enforced; Community's "Community Ownership" (exactly one owner) and "Historical Integrity" (leadership history never deleted) invariants enforced; Authorization's "Deny is default" and "Permissions never assigned directly to Users" invariants enforced
- [ ] Architectural: one repository per aggregate (no generic/base repositories — Article 26); aggregate state changes only through aggregate methods, never direct field mutation (Article 13)
- [ ] Engineering: Application Services are single-use-case (no `UserService`/`CommunityService` God Services — Article 24); naming reflects business language (Article 4)
- [ ] Security: passwords hashed (never plaintext, Article "Credential Protection"); JWT secrets in environment variables, never in code or logs; refresh tokens rotate on use
- [ ] Quality: aggregate invariant tests exist for every invariant listed above; exceptions handled intentionally, never swallowed (Article 28)

**Acceptance Criteria:** A user can register, verify their email, log in, create or join a Community, be assigned a Community Position, and have that position's permissions correctly evaluated by Authorization (Allow for a granted permission, Deny for one that isn't) — demonstrated via real API calls against deployed infrastructure.

**Definition of Done:** All Quality Gates checked, acceptance criteria demonstrated, Domain Event Catalog (Specification Section 6) updated for Profile/Authentication/Authorization's newly-defined events, no unresolved TODOs, code reviewed against Constitution Part I–III. Only after this is Phase 1 allowed to begin (Event Management hard-depends on Community existing).

---

### 3.3 Phase 1 — Core Event Lifecycle

**Objectives:** Deliver Event Management, MVP-scoped Committee Domain, full Authorization integration, and Registration.

**Deliverables:**
- **Event Management** — Event aggregate (identity, metadata, configuration, visibility), Event Lifecycle FSM (Draft → Published → Registration Open → Registration Closed → Live → Completed → Archived, plus Cancelled), Session aggregate
- **Committee Domain (MVP-scoped)** — `EventCommittee`, `CommitteeRole`, `RoleAssignment` only (no Reporting Hierarchy)
- **Authorization Domain — full integration** — `ResponsibilityReference` now resolves to real Community Positions and Committee Roles, replacing the opaque placeholder from Phase 0
- **Registration Aggregate** — form, questions, rules, capacity policy, approval strategy
- **Event modeling for Committee Domain** (Event Modeling Pending) — define events (e.g. committee creation, role assignment) and update Specification Section 6

**Dependencies:** Phase 0 complete (Community and Authorization core engine must exist).

**Quality Gates:**
- [ ] Business: Event Lifecycle transition preconditions enforced exactly as specified (Ch.23 — e.g. "Draft → Published" requires required metadata, owning community, event owner assigned); Committee's "Membership Requirement" invariant (only Community Members may hold Committee Roles) enforced; Registration's "Registration Window" and capacity/approval-strategy rules enforced
- [ ] Architectural: all domain events from the confirmed catalog implemented exactly as named — `EventCreated`, `EventPublished`, `RegistrationOpened`, `RegistrationClosed`, `EventStarted`, `EventCancelled`, `EventCompleted`, `EventArchived`, `CommunityOwnershipTransferred` (consumed correctly per the 6.2 resolution — canonical name, not `OwnershipTransferred`)
- [ ] Architectural: Authorization's `ResponsibilityReference` integration tested against both a Community Position grant and a Committee Role grant, confirming both resolve correctly
- [ ] Engineering: Session aggregate remains a separate aggregate from Event (no field-level coupling — Article 5, 13)
- [ ] Quality: Event Lifecycle FSM has a test for every valid transition and at least one test per invalid-transition rejection

**Acceptance Criteria:** An organizer can create an Event, assign a Committee (with roles and role assignments), publish the Event, open Registration, and have Authorization correctly evaluate permissions based on the organizer's real Community Position or Committee Role — no opaque test references remain.

**Definition of Done:** All Quality Gates checked, acceptance criteria demonstrated, Domain Event Catalog updated for Committee Domain, code reviewed. Only after this is Phase 2 allowed to begin (Enrollment hard-depends on Registration; Volunteer hard-depends on Committee).

---

### 3.4 Phase 2 — Participation & Operations

**Objectives:** Deliver the full participation chain (Enrollment → Attendance → Certificate) and Volunteer Domain.

**Deliverables:**
- **Enrollment Aggregate** — responses, approval, confirmation, waitlist
- **Attendance Aggregate** — check-in, verification, session attendance
- **Certificate Aggregate** — recognition policy, eligibility, issuance, verification
- **Volunteer Domain** — `OperationalTask`, `TaskAssignment`, `TaskDependency`, `TaskChecklist`, anchored to MVP-scoped Committee Roles from Phase 1
- **Event modeling for Volunteer Domain** (Event Modeling Pending) — define task lifecycle events and update Specification Section 6

**Dependencies:** Phase 1 complete.

**Quality Gates:**
- [ ] Business: Enrollment's "one active Enrollment per User per Event" invariant enforced; capacity/waitlist logic correctly frozen at Registration Closed; Attendance's "Enrollment Requirement" (only confirmed enrollments create attendance records) enforced; Certificate's "Eligibility is evaluated using the Recognition Policy" (not attendance alone, unless policy says so) enforced; Volunteer's "Committee Ownership" of tasks enforced (every task belongs to exactly one Committee Role, per Ch.33)
- [ ] Architectural: all cataloged events implemented — `EnrollmentStarted/Submitted/Approved/Rejected/Cancelled/Confirmed/WaitlistPromoted`, `AttendanceRecorded/Updated/Verified/Completed`, `CertificateEligible/Issued/Revoked/Regenerated/Verified`. `RecognitionApproved` must **not** be implemented (removed per Specification 2.4.3 — documentation artifact, no such event exists)
- [ ] Architectural: Certificate correctly consumes `AttendanceCompleted`, never derives eligibility from Enrollment directly (Attendance is the authoritative source per Ch.28–29)
- [ ] Engineering: no shared mutable state between Enrollment, Attendance, and Certificate aggregates (Article 5, 13 — each transition happens through its own aggregate's methods)
- [ ] Quality: end-to-end test covering the full chain — Registration → Enrollment → Attendance → Certificate — for at least one realistic scenario

**Acceptance Criteria:** A participant can register for an Event, get enrolled and approved, check in (Attendance recorded), and automatically become eligible for and receive a Certificate once the Recognition Policy's criteria are satisfied — the entire participation journey working end-to-end. A Committee Role can have Operational Tasks assigned to it and tracked to completion.

**Definition of Done:** All Quality Gates checked, acceptance criteria demonstrated, Domain Event Catalog updated for Volunteer Domain, code reviewed. Only after this is Phase 3 allowed to begin.

---

### 3.5 Phase 3 — Communication & Composite Experience

**Objectives:** Deliver Announcement and Notification Domains, and assemble the first version of the Event Workspace composite read model.

**Deliverables:**
- **Announcement Domain** — content, audience, scheduling, publication lifecycle, `AnnouncementAttachment` (wired to Cloudinary/S3 storage per `SystemDesign.md`)
- **Notification Domain** — email delivery at minimum (push/in-app optional for MVP unless already planned), preference evaluation, delivery status tracking
- **Event Workspace — partial CQRS assembly** — composing Event, Committee, Volunteer, and Announcement contributions (Analytics/Recommendation contributions arrive in Phase 4, per Specification Section 4.2)
- **Event modeling for Notification Domain** (Event Modeling Pending) — define delivery-lifecycle events (e.g. delivery sent/failed) and update Specification Section 6

**Dependencies:** Phase 2 complete. Notification also requires Authorization's full integration (Phase 1) and Announcement (this phase, built first within it).

**Quality Gates:**
- [ ] Business: Announcement's "Audience Resolution" (resolved dynamically at delivery time, not frozen at authoring time) enforced; Notification's "mandatory operational communications are always preserved" rule enforced (user preferences never suppress required notifications)
- [ ] Architectural: all cataloged Announcement events implemented — `AnnouncementCreated/Scheduled/Published/Updated/Archived`; Announcement correctly consumes `RegistrationOpened`, `RegistrationClosed`, `EventStarted`, `EventCompleted` (per Ch.30's own catalog)
- [ ] Architectural: Notification never authors message content — it only delivers what Announcement (or another publishing context) already decided (Section 1.1's "what vs. how" boundary enforced in code, not just in the model)
- [ ] Architectural: Event Workspace read model is rebuildable from Domain Events (Constitution Article 20 — if corrupted, delete and replay, never manually patched)
- [ ] Engineering: Cloudinary/S3 integration lives entirely in Infrastructure layer, never called from Domain or Application layers
- [ ] Quality: a published Announcement demonstrably triggers real notification delivery through at least one channel in an integration test

**Acceptance Criteria:** Publishing an Announcement causes the correct audience to receive it via at least one delivery channel, respecting individual notification preferences except where delivery is mandatory. Opening the Event Workspace for a real Event shows live data composed from Event, Committee, Volunteer, and Announcement — not placeholder or manually-assembled data.

**Definition of Done:** All Quality Gates checked, acceptance criteria demonstrated, Domain Event Catalog updated for Notification Domain, code reviewed. Only after this is Phase 4 allowed to begin.

---

### 3.6 Phase 4 — Intelligence Layer

**Objectives:** Deliver Analytics Domain, Intelligence Domain (v0.1), and Recommendation Domain (v0.1 / AI Assistant v0.1), and complete the Event Workspace.

**Deliverables:**
- **Analytics Domain** — metric definitions and calculations for every context built so far (Community, Event, Registration, Enrollment, Attendance, Certificate, Committee, Volunteer, Announcement); built incrementally, not as one big-bang integration (per Section 2.6's note — event-consumer code for each context can be written as soon as that context lands, from Phase 1 onward)
- **Intelligence Domain (v0.1)** — context assembly, insight/prediction/summary generation, "recommendation signal generation" per the Section 5.2 resolution (Intelligence does **not** generate final recommendations)
- **Recommendation Domain (v0.1) — AI Assistant v0.1** — Gemini API integration; delivers exactly the 5 confirmed capabilities from Roadmap Section 0.2 (event summaries, registration insights, attendance insights, analytics-based recommendations, NL interaction with analytics) and nothing beyond them
- **Event Workspace — complete** — Analytics and Recommendation contributions added to the composite read model
- **Event modeling for Analytics, Intelligence, and Recommendation** (all Event Modeling Pending) — define events only where a real cross-context reaction is needed; per Specification Section 6.3, some of these contexts may legitimately remain pure event *consumers* that never publish events of their own — do not invent outbound events just for symmetry

**Dependencies:** Phase 3 complete for full Event Workspace assembly; Analytics' incremental work can and should start earlier (see Section 2.6).

**Quality Gates:**
- [ ] Business: Analytics never becomes a system of record — it only observes (Ch.35's own invariant); Intelligence and Recommendation never make autonomous business decisions (Constitution's Never-Ever list, AI section)
- [ ] Architectural: AI Assistant v0.1 performs **zero write operations** — verify by code review that no Application Service invoked by the AI layer calls any aggregate's mutating methods, only read models and query services
- [ ] Architectural: every AI-generated insight/recommendation traces back to real Analytics data (explainability — Ch.36/37's own design principle); no hallucinated or fabricated figures presented as fact
- [ ] Architectural: Recommendation Domain consumes Intelligence's signals rather than duplicating "recommendation generation" — the Section 5.2 ownership boundary must be visible in the actual code structure (Intelligence produces signals; only Recommendation produces the final recommendation object)
- [ ] Engineering: Gemini API calls isolated to Infrastructure layer behind a Domain-level interface (Constitution Article 11 — Domain never imports an AI SDK directly)
- [ ] Security: no user data sent to the Gemini API beyond what's necessary for the specific query being answered; Authorization respected — a user only receives insights for data they're permitted to see (Ch.36's "Authorization Awareness" rule)
- [ ] Quality: AI Assistant v0.1's 5 capabilities each have at least one test verifying a correct, evidence-backed response for a realistic query

**Acceptance Criteria:** A user can ask a natural-language question about their event (e.g. "how is registration trending?" or "summarize attendance for Session 3") and receive an accurate answer grounded in real Analytics data, with no autonomous action taken and no capability beyond the 5 confirmed in scope. The Event Workspace now shows a fully composed view across all MVP bounded contexts.

**Definition of Done:** All Quality Gates checked, acceptance criteria demonstrated, Domain Event Catalog updated for any events actually defined in this phase, code reviewed. **Completion of this phase means MVP v1 is feature-complete per Roadmap Section 0.1.**

---

### 3.7 MVP v1 — Overall Definition of Done

MVP v1 is complete only when all of the following are true simultaneously:

- [ ] Walking Skeleton through Phase 4 all individually meet their Definition of Done above
- [ ] Every bounded context in Roadmap Section 0.1 is deployed and reachable in production
- [ ] The Domain Event Catalog (Specification Section 6) reflects every event actually implemented, including all contexts that were Event Modeling Pending at the start of this roadmap
- [ ] No known violation of any Constitution Article remains unresolved
- [ ] No unresolved TODOs, no dead code, no `any` types without recorded approval
- [ ] The scoped exceptions recorded in Roadmap Section 0 (MVP-scoped Committee Domain, AI Assistant v0.1) are implemented exactly as scoped — no silent expansion beyond what was agreed
- [ ] Deferred modules (Section 0.3) remain genuinely untouched — no partial/ad-hoc implementation of Sponsorship, Content, Discovery & Engagement, Platform Administration, or the full Committee/User Profile experiences

---

*End of Section 3 (Draft). Once approved, the Implementation Roadmap v1.0 is frozen and Walking Skeleton implementation may begin.*
