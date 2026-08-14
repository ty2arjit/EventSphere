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

**Account-linking policy decided (Phase 0):** auto-link on verified email match. If Google returns `email_verified: true` for an email that already has a `UserCredential`, a `google` `AuthenticationProvider` is attached. If either side is unverified, require explicit confirmation. Policy recorded; no OAuth code implemented yet.

**Related:** BL-002 (account enumeration) resolved — all auth endpoints return generic responses.

---

## From: Walking Skeleton Architecture Review

### ✅ BL-001 — Email normalization duplicated across layers (RESOLVED)
**Origin:** Walking Skeleton review, finding M1
**Status:** Resolved during Profile Domain Phase 0 expansion

Fixed by introducing an `Email` Value Object (`apps/api/src/modules/profile/domain/valueObjects/Email.ts`) as the single source of truth for trim/lowercase normalization and format validation. Both `User.register()` and `RegisterProfileService.execute()` now go through `Email.create()`. Canonical Architecture Specification §2.1 amended accordingly (User's Value Objects list now includes `Email`).

---

### ✅ BL-002 — Account enumeration via registration error (RESOLVED)
**Origin:** Walking Skeleton review, finding M3
**Status:** Resolved during Authentication Domain implementation (Phase 0)

All auth endpoints now return generic responses regardless of whether an email exists. Registration returns `{ ok: true }` ("check your email") whether the address is new or existing. Login returns a generic `Invalid email or password`. Password reset similarly never leaks existence. Rate limiting (`express-rate-limit`) caps `/register`, `/login`, `/password/request-reset`, and `/email/request-verification`.

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

### ✅ BL-005 — `updatedAt` is persisted but not modeled in the domain (RESOLVED)
**Origin:** Walking Skeleton review, low-priority finding
**Status:** Resolved during Profile Domain Phase 0 expansion

`updatedAt` is now part of `UserProps`, bumped by every mutating aggregate method (`updateProfile`, `updateAvatar`, `updatePreferences`, `verifyIdentity`, `deactivate`, `archive`), and returned in `ProfileResponseDto`. Resolved exactly when originally anticipated — "when Profile update operations are implemented."

---

### ✅ BL-006 — No `helmet` / security headers middleware (RESOLVED)
**Origin:** Walking Skeleton review, low-priority finding
**Status:** Resolved during production hardening pass (pre-Phase 0)

Helmet is installed and mounted as the first middleware in `app.ts`. Security headers (HSTS, nosniff, frame-ancestors, etc.) now apply to every response.

---

### ✅ BL-007 — Rate limiting uses in-memory store (RESOLVED)
**Origin:** Walking Skeleton review
**Status:** Resolved — Redis-backed store active when `REDIS_URL` is configured

`express-rate-limit` protects `/register`, `/login`, `/password/request-reset`, `/email/request-verification`, and `/email/verify` with per-IP limits, now backed by `rate-limit-redis` (`src/modules/authentication/api/middleware/rateLimit.ts`) via a shared lazy Redis client (`src/shared/cache/redisClient.ts`). Falls back to express-rate-limit's default in-memory store when `REDIS_URL` is unset (local dev), same "inert until configured" pattern as Mailer/Cloudinary. Limits now persist across restarts and would be shared correctly if this ever runs on more than one Railway instance.

**Also added:** `CachedMetricRepository` (`src/modules/analytics/infrastructure/`) caches the Analytics event-dashboard read (`findByEntityId`, 30s TTL, invalidated on every `save()`) through the same Redis client — the first read-model caching use of Redis, per `SystemDesign.md`'s "frequently accessed read models" caching goal.

**Also added:** `CachedPermissionPolicyRepository` (`src/modules/authorization/infrastructure/`) caches the singleton `PermissionPolicy` — loaded on every authorization check across the app, the busiest read in the system. 5-minute TTL as a safety net; correctness comes from invalidating on every `save()` (every grant/revoke/permission-create path goes through the same repository, so no call site can bypass invalidation). A failed cache delete after a mutation is logged at `error`, not `warn` — a stale policy here can mean a just-revoked grant keeps returning `Allow`, which is the one failure mode in this caching pass worth paging on.

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

### ✅ BL-009 — Zero component tests (RESOLVED)
**Origin:** Frontend Walking Skeleton review, finding M1
**Status:** Resolved during Profile Domain Phase 0 expansion

Testing Library + jsdom established as the frontend component-testing strategy (`@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom@25` — pinned to match Vitest 2.1.x's expected API surface). `vitest.config.ts` now runs `.test.tsx` under a `jsdom` environment with a shared `vitest.setup.ts` (jest-dom matchers, a `PointerEvent` polyfill jsdom lacks that Base UI's Checkbox/Select rely on). `ProfileRegistrationForm.test.tsx` closes the original gap; `ProfileView`, `ProfileEditForm`, and `PreferencesForm` also got tests as part of the same pass.

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

---

## From: Authentication Domain (Phase 0)

### 🔵 BL-014 — Production email delivery not implemented
**Origin:** Authentication Domain blueprint, decision 8
**Status:** Deferred — `ConsoleMailer` logs links to server console

Verification and password-reset emails are logged to stdout via `ConsoleMailer`. Production requires a real email provider (Postmark, SES, or similar) implementing the `Mailer` interface.

**Next action:** integrate a production email provider before any public-facing deployment with real users.

---

### 🔵 BL-015 — MFA not implemented
**Origin:** Ch.20 lists MFA as a future authentication mechanism
**Status:** Deferred — not in Phase 0 scope per Ch.20 itself

TOTP/WebAuthn MFA will be needed for sensitive operations. The `AuthenticationProvider` entity and `UserCredential.providers[]` array already accommodate additional mechanisms.

**Next action:** implement when security requirements escalate or before handling financial/sensitive data.

---

### 🔵 BL-016 — Refresh token theft alerting
**Origin:** Authentication Domain blueprint
**Status:** Deferred — theft detection works (revokes all sessions), but no alerting

When a previously-rotated refresh token is reused (indicating theft), `RefreshSessionService` revokes all sessions for that credential. The user is not notified.

**Next action:** send an alert email when theft is detected, once production email delivery (BL-014) is in place.

---

### 🔵 BL-017 — Session listing / device management UI
**Origin:** Authentication Domain blueprint
**Status:** Deferred — no UI for viewing/revoking individual sessions

Users can log out everywhere but cannot see their active sessions or revoke specific ones.

**Next action:** add to profile dashboard when Community Domain is complete.
