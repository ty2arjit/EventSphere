# EventSphere — Technical Backlog

Known technical debt, deferred decisions, and documented assumptions. Each item records what was decided, why, and when it should be revisited — so nothing is silently forgotten and no future engineer (or AI assistant) has to guess whether something was an oversight or a deliberate choice.

**Status key:** 🔴 Blocking next phase (must be resolved before Phase 0) · 🟠 High priority (early Phase 0) · 🔵 Deferred (decision made, action scheduled) · 🟡 Accepted risk (no action planned yet) · ⚪ Assumption (documented for traceability)

**Currently blocking Phase 0:** none. *(BL-008 resolved — see below.)*

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

---

## From: Frontend Walking Skeleton Architecture Review

Conclusion was ⚠️ *Approved with Minor Improvements* — no finding required changes before freeze. All items below are forward-looking: they concern scaling to Phase 0's many features rather than defects in the Walking Skeleton slice.

### ✅ BL-008 — No frontend folder-structure convention exists — **RESOLVED**
**Origin:** Frontend Walking Skeleton review, finding H1
**Status:** ✅ **Resolved** — Canonical Architecture Specification **§7.5** added (amendment recorded in §7.5.5), and the existing Profile implementation migrated to conform in the same change (commit `3b3e97f`).

Canonical Architecture Specification §7 and `SystemDesign.md` both define only the **backend** module structure (`domain/`, `application/`, `infrastructure/`, `controller/`, …). Neither says anything about the frontend. The current layout — `app/<route>/` for routes and components, `lib/api/` for transport, `lib/validation/` for schemas — is sound, but it is undocumented and therefore unenforced.

**Why this matters most:** Phase 0 adds Authentication, Community, and Event UI. Without an agreed convention, each context will structure itself differently, and retrofitting a convention across four contexts is materially more expensive than agreeing one now.

**Deliberately not fixed by changing code** — the code is fine; the *specification* is silent. Aligning the two means amending the spec, which requires explicit approval (Constitution Article 8).

**Next action:** a short dedicated session to define the convention, then amend §7. Scheduled to occur after the Walking Skeleton freeze and before Phase 0 implementation.

---

### 🟠 BL-009 — Zero component tests
**Origin:** Frontend Walking Skeleton review, finding M1
**Status:** Deferred — to be addressed as one of the **first Phase 0 engineering tasks**

`lib/` has 51 passing tests. `app/profile/ProfileRegistrationForm.tsx` has **none**. Every UI state (loading, success, error, validation) was verified manually in a browser.

**Evidence the risk is real, not theoretical:** during Step 7, a stale placeholder (*"Result panel — implemented in Step 7."*) rendered on the page while **every programmatic DOM assertion passed**. Only a screenshot caught it. Automated component tests would have caught the regression that assertions missed.

This was a deliberate deferral recorded in the frontend plan (§14: "Component-level rendering tests are deliberately excluded — that's a heavier dependency set than a wiring proof warrants"). That reasoning held for a wiring proof; it does not hold for feature development.

**Next action:** establish the frontend testing strategy (likely Testing Library + jsdom) early in Phase 0, before multiple feature UIs exist.

---

### 🟠 BL-010 — Request cancellation supported but unused
**Origin:** Frontend Walking Skeleton review, finding M2
**Status:** Deferred — implement when navigation and multiple pages exist

`lib/api/profileClient.ts` accepts an `AbortSignal`, and `lib/api/http.ts` already combines it with the client-side timeout via `AbortSignal.any()`. The form never passes one.

**Consequence:** navigating away mid-request leaves an orphaned in-flight request and triggers a state update on an unmounted component — wasted work rather than a user-visible bug.

**Why it's low impact today:** the Walking Skeleton has exactly one page and no navigation, so there is nowhere to navigate away *to*.

**Next action:** wire an `AbortController` (cleared on unmount) once Phase 0 introduces routing between pages. The transport plumbing already exists, so this is a small change confined to components.

---

### 🟡 BL-011 — No internationalisation foundation
**Origin:** Frontend Walking Skeleton review, finding L1
**Status:** Deferred — record as a **Phase 0 architectural decision**; no implementation work now

13 user-facing English strings are hardcoded across `errorMessages.ts`, `registerProfileSchema.ts`, and `ProfileRegistrationForm.tsx`.

**Why worth deciding early:** Chapter 8 of the Product Bible explicitly targets *"a national conference"* and *"an international summit."* Retrofitting i18n across many features is substantially more expensive than establishing the pattern before those features exist. Note that error copy is already centralised in `errorMessages.ts`, which is a favourable starting point.

**Next action:** a Phase 0 architectural decision on whether (and when) to adopt an i18n library. Deciding "not yet, and here's the trigger" is an acceptable outcome — the point is to decide deliberately rather than by default.

---

### 🟡 BL-012 — Raw ISO timestamp rendered in UI
**Origin:** Frontend Walking Skeleton review, finding L2
**Status:** Accepted for the Walking Skeleton — address during real feature development

The success panel renders `createdAt` verbatim (e.g. `2026-08-03T06:30:59.055Z`).

**Why acceptable now:** the raw value is genuinely *useful* for a verification artifact — it makes the round trip inspectable. It is not acceptable for user-facing product UI.

**Next action:** introduce presentation-layer date formatting when the first real feature UI is built. Any locale-aware formatting choice should be made together with BL-011 (i18n), since the two are coupled.

---

### 🟡 BL-013 — No code formatter configured
**Origin:** Frontend Walking Skeleton review, finding L3
**Status:** Deferred — **Phase 0 engineering task**

Quote style is already inconsistent: `lib/api/http.ts` and `lib/api/config.ts` use single quotes; every other frontend file uses double. ESLint is configured but performs no formatting.

**Why worth doing before the codebase grows:** a formatter introduced later produces a large mechanical diff across every file, which obscures real changes in review history. Introducing it while the codebase is small keeps that diff trivial.

**Next action:** add Prettier (with an ESLint integration that avoids rule conflicts) as part of standard frontend tooling early in Phase 0.
