# EventSphere — Technical Backlog

Known technical debt, deferred decisions, and documented assumptions. Each item records what was decided, why, and when it should be revisited — so nothing is silently forgotten and no future engineer (or AI assistant) has to guess whether something was an oversight or a deliberate choice.

**Status key:** 🔵 Deferred (decision made, action scheduled) · 🟡 Accepted risk (no action planned yet) · ⚪ Assumption (documented for traceability)

---

## Forward Architectural Requirements

Confirmed future capabilities, recorded so current implementation decisions stay compatible with them. **Not** work items for the current phase.

### 🔵 FR-001 — Google Sign-In (OAuth 2.0 / OpenID Connect)
**Origin:** Project owner directive during Walking Skeleton Step 4
**Status:** Future requirement — explicitly **not** in Walking Skeleton or Phase 0 scope
**Owning context:** Authentication Domain (existing, confirmed — Canonical Architecture Specification Section 1.1)

Google Sign-In will be supported as an authentication provider. Explicitly out of scope for now: no OAuth implementation, no Google SDKs, no authentication libraries, no roadmap change.

**Already accommodated by the frozen architecture.** Chapter 20 ("Authentication Provider") already names Google OAuth among anticipated mechanisms and states the governing invariant: *"Regardless of provider, authentication always resolves to one canonical User Aggregate."* This requirement therefore introduces **no new architectural obligation** — it confirms an existing one.

**Why current implementation stays compatible:**

| Existing decision | Effect on future OAuth |
|---|---|
| `User` aggregate holds identity only — no password field (Ch.19) | ✅ A Google-authenticated user simply has no local credential; nothing to null out or work around |
| Credentials isolated in `UserCredential`, a separate aggregate in a separate bounded context (Ch.20) | ✅ Adding a provider touches Authentication Domain only; Profile Domain is untouched |
| Email is profile data on `User`, not a credential | ✅ Maps directly to the OIDC `email` claim |
| API client is a generic `request()` wrapper, not endpoint-specific | ✅ OAuth callback/token endpoints need no new transport layer |
| CORS already configured with `credentials: true` | ✅ Cookie-based OAuth session flows work without revisiting CORS |
| No auth library committed to yet | ✅ Provider choice remains fully open |

**Assessment: no change required.** Nothing in the Walking Skeleton makes OAuth harder to add later.

**One genuinely new design question for Phase 0 — account linking.** Once two paths can create a `User` (self-registration and OAuth callback), the platform must decide what happens when someone registers with email X and later signs in with Google using the same email X. Options include auto-linking on verified email, requiring explicit confirmation, or treating them as distinct identities. This is an Authentication Domain design decision to settle when that domain is implemented — not a defect in current code, and not resolvable now.

**Related:** BL-002 (account enumeration) gains importance once OAuth exists, since a linking flow can leak whether an email is already registered.

---

## From: Walking Skeleton Architecture Review

### 🔵 BL-001 — Email normalization duplicated across layers
**Origin:** Walking Skeleton review, finding M1
**Status:** Deferred — approved by project owner, do not change the model yet

`User.register()` normalizes email via `.trim().toLowerCase()`, and `RegisterProfileService.execute()` independently repeats the same normalization before calling `findByEmail()`. The same business rule is expressed in two places; if either drifts, duplicate detection silently breaks (Constitution Article 6 — Single Source of Truth).

**Why not fixed now:** the natural fix is an `Email` Value Object, but the Canonical Architecture Specification (Section 2.1) currently lists User's value objects as `FullName`, `Avatar`, `SocialLinks (future)` — no `Email` VO. Introducing one is an architecture change requiring explicit approval (Constitution Article 8), not an implementation detail.

**Revisit when:** the Authentication and Identity model expands (Phase 0). At that point, decide whether to add an `Email` Value Object and amend Specification Section 2.1 accordingly.

---

### 🟡 BL-002 — Account enumeration via registration error
**Origin:** Walking Skeleton review, finding M3
**Status:** Accepted risk — known security consideration, deliberately not addressed yet

`POST /api/v1/profile` returns `EMAIL_ALREADY_REGISTERED` with the message `Email already registered: <email>`, allowing an unauthenticated caller to determine whether a given address has an account.

**Why acceptable now:** the Walking Skeleton has no authentication, no sessions, and no production users — there is nothing yet to enumerate against. The endpoint exists to prove stack wiring.

**Revisit when:** Authentication Domain is implemented (Phase 0). Standard mitigations to weigh then: generic response messages, rate limiting on registration (Redis is already in the stack per `SystemDesign.md`), and/or email-verification-based registration flows that don't confirm existence synchronously.

**Constraint:** must be resolved before any production launch carrying real user data.

---

### 🔵 BL-003 — Integration tests share the development database
**Origin:** Walking Skeleton blueprint Section 14; noted in-file in `PrismaProfileRepository.integration.test.ts`
**Status:** Deferred — stopgap in place

Repository integration tests run against the same Neon database used by `prisma migrate dev`, with per-test cleanup (`afterEach` deletes rows created by that test). The approved blueprint called for an isolated Neon branch.

**Risk:** a failed cleanup leaves residue in the dev database; parallel test runs could interfere with each other.

**Revisit when:** before Phase 0 begins in earnest — the risk scales with the number of contexts and tests.

---

### ⚪ BL-004 — Correlation IDs are per-event, not per-request
**Origin:** Walking Skeleton, H2 implementation
**Status:** Documented assumption

Constitution Article 18 requires every domain event to carry a Correlation ID. `createDomainEvent()` satisfies this by generating one per event when none is supplied. There is not yet request-scoped context propagation, so two events emitted during the same HTTP request currently receive *different* correlation IDs.

**Consequence:** correlation IDs are present and structurally valid, but cannot yet be used to trace a multi-event business flow end-to-end.

**Revisit when:** the first cross-context event flow appears (Phase 1+), where tracing genuinely matters. Likely approach: AsyncLocalStorage-based request context, with the ID threaded from `pino-http`'s request ID.

---

### ⚪ BL-005 — `updatedAt` is persisted but not modeled in the domain
**Origin:** Walking Skeleton review, low-priority finding
**Status:** Documented assumption

The Prisma `User` model has `updatedAt` (Prisma-managed via `@updatedAt`), but the `User` aggregate does not expose it, and `ProfileResponseDto` does not return it.

**Why acceptable:** the Walking Skeleton is create-only — there are no update operations, so the field has no business meaning yet. Modeling it would be speculative (Constitution Article 37 — minimize new concepts; YAGNI).

**Revisit when:** Profile update operations are implemented (Phase 0).

---

### 🟡 BL-006 — No `helmet` / security headers middleware
**Origin:** Walking Skeleton review, low-priority finding
**Status:** Accepted risk

The Express app sets no security headers (CSP, HSTS, X-Frame-Options, etc.).

**Why acceptable now:** the API serves JSON to a known origin with no authentication, no cookies, and no browser-rendered HTML.

**Revisit when:** Authentication Domain lands (Phase 0) — HTTP-only auth cookies make header hardening materially important.

---

### 🟡 BL-007 — No rate limiting
**Origin:** Walking Skeleton review
**Status:** Accepted risk — already anticipated by the architecture

No throttling on any endpoint. `SystemDesign.md` already designates Redis for rate limiting, so the intended mechanism exists in the plan; it simply isn't wired up.

**Revisit when:** Authentication Domain (Phase 0) — login and registration endpoints are the natural first targets, and BL-002's mitigation likely depends on this.
