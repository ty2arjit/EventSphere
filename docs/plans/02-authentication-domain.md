# Authentication Domain — Phase 0, Context 2 of 4

## Context

The Walking Skeleton has no authentication — every profile endpoint is unauthenticated, and there is no concept of a signed-in user anywhere in the codebase. Phase 0 requires the Authentication Domain (Ch.20) before Community and Authorization can be built, because Community endpoints presuppose an authenticated caller and Authorization's `PermissionPolicy` evaluates permissions against an authenticated identity.

**Scope for this pass:** everything Ch.20 marks as owned that Phase 0 Roadmap §3.2 explicitly names: **registration (credential creation), login, logout, JWT issuance/refresh, password reset, email verification, secure password hashing.** Everything Ch.20 marks as "future scope" (passkeys, biometrics, MFA, enterprise SSO, hardware keys, risk-based auth, device trust, session anomaly detection) is out. Google OAuth (FR-001) is confirmed compatible but not built — only the account-linking policy decision needs to be made and recorded.

**Boundaries we are NOT crossing:**
- Authentication owns credentials and sessions; Profile still owns identity/name/email/verifiedAt. The two synchronize via a domain event, never via direct repository access (Constitution Article 12).
- Authorization is a separate later context — Authentication produces `req.user` for downstream middleware; it does not evaluate permissions.

## Approved Decisions (locked; do not re-litigate)

These are proposed defaults for the user to confirm before implementation begins. All are chosen to match either an existing project decision or an unambiguous stack-level standard; each has a one-line rationale so it's easy to challenge if wrong.

1. **Password hashing: argon2id** via the `argon2` npm package. Argon2id is the current OWASP recommendation; bcrypt is acceptable but weaker to GPU attacks. Ch.20 explicitly requires "Hashing algorithms should be upgradeable without changing business logic," which we honor via a hash-version prefix stored alongside the hash.
2. **JWT library: `jose`** (not `jsonwebtoken`). Actively maintained, modern API, supports the algorithms we need (HS256 or EdDSA), TypeScript-native.
3. **Tokens: HS256 access + refresh, both signed with the same server secret family** (one secret per purpose). Access token lifetime: **15 minutes**. Refresh token lifetime: **30 days**. Refresh tokens **rotate on every use** (Roadmap Quality Gate).
4. **Delivery: HTTP-only, `SameSite=Lax`, `Secure` (prod only) cookies.** Cookie names: `es_access`, `es_refresh`. `SystemDesign.md` already commits to this and CORS is already configured with `credentials: true`.
5. **Refresh token storage: PostgreSQL table `refresh_tokens`** (not Redis for this pass). Each row = one active refresh token bound to a UserCredential; rotation writes a new row and marks the old one revoked. Postgres is Ch.20's source of truth per SystemDesign.md; Redis remains a future optimization for hot-session caching.
6. **Redis: not required for this pass.** Rate limiting uses `express-rate-limit`'s in-memory store for now (single-instance deployment is fine on Railway today). BL-007 stays open with a scope note. This unblocks Phase 0 without dragging Redis provisioning into the critical path.
7. **Verification tokens: PostgreSQL table `verification_tokens`.** Random 32-byte tokens, stored hashed, single-use, 24-hour expiry.
8. **Email delivery: dev-mode logs the verification/reset link to the server console; production sends via a `Mailer` interface.** Concrete SMTP/provider integration is deferred to a follow-on task (documented in TECHNICAL_BACKLOG.md) — the interface exists so the code isn't blocked on picking a provider.
9. **Cross-context integration with Profile: domain event.** Authentication publishes `EmailVerified`; Profile subscribes and calls its own `VerifyIdentityService.execute(userId)`. Authentication never imports `ProfileRepository`.
10. **FR-001 (Google OAuth) account-linking policy:** **auto-link on verified email match.** If Google returns `email_verified: true` for an email that already has a `UserCredential`, we attach a `google` `AuthenticationProvider` to the existing credential. If the local email is unverified or Google's is unverified, require explicit confirmation. This is a *policy decision recorded now*; no OAuth code is implemented.
11. **BL-002 (account enumeration): resolved this pass.** Registration returns a generic `Check your email to complete registration` regardless of whether the email was new or existing. Login returns a generic `Invalid email or password`. Rate limiting caps both endpoints. Actual email is only sent to the real owner.

---

## 1. Domain Layer

`apps/api/src/modules/authentication/domain/`

### Value Objects (VOs)

Ch.20's Spec table lists no VOs (dash), so this blueprint proposes:

- `HashedPassword.ts` — wraps `{algorithm, hash}` string. Static factory `HashedPassword.fromPlaintext(plaintext, hasher)` (async); `HashedPassword.fromPersistence(serialized)`. `.verify(plaintext, hasher): Promise<boolean>`. Never exposes the raw hash except via `.serialized` (for persistence only). Algorithm-versioned so future upgrades are just a new prefix, per Ch.20's "upgradeable without changing business logic".
- `PlaintextPassword.ts` — validates strength requirements at the domain boundary. Rules (minimal, defensible defaults): min 12 chars, at least one letter and one digit. Configurable via constructor for future tightening. Throws `WeakPasswordError`. Zeroed from memory after hashing (best-effort JS).
- `EmailAddress.ts` — same shape as Profile's `Email` VO, **not shared** across contexts (bounded context isolation). Duplicated intentionally — each context normalizes its own boundary input. Same validation regex.

### Entities

Owned by the `UserCredential` aggregate, constructed only through it (Article 13):

- `AuthenticationSession.ts` — `{id, userCredentialId, refreshTokenHash, createdAt, expiresAt, revokedAt, deviceLabel, ipAddress}`. Represents one login. Methods: `revoke()`, `isActive()`, `rotate(newRefreshTokenHash)` — returns a new session, marks self revoked.
- `VerificationToken.ts` — `{id, userCredentialId, purpose: 'email_verification' | 'password_reset', tokenHash, createdAt, expiresAt, consumedAt}`. Methods: `consume()` — throws if already consumed or expired.
- `AuthenticationProvider.ts` — `{provider: 'password' | 'google', providerAccountId, linkedAt}`. Multiple providers per credential allowed; `password` provider is always the primary for a locally-registered user.

### Aggregate Root: UserCredential

```typescript
interface UserCredentialProps {
  id: string;                       // same as User.id from Profile — 1:1 mapping
  email: EmailAddress;              // Auth's own copy, kept in sync via event
  hashedPassword: HashedPassword | null;  // null for OAuth-only accounts
  emailVerifiedAt: Date | null;
  providers: AuthenticationProvider[];
  activeSessions: AuthenticationSession[];
  outstandingTokens: VerificationToken[];
  createdAt: Date;
  updatedAt: Date;
}
```

**Ch.20 Invariants enforced by the aggregate:**
- One credential record per user — `id` is unique, matches `User.id` (Profile).
- Passwords always stored as hashes — `hashedPassword` type is `HashedPassword`, never `string`.
- Credentials never exist without a User — enforced at Application layer (registration flow creates User then Credential in one transaction).
- Providers resolve to one canonical User — `providers[]` all point to the same `id`.
- Sessions belong to one identity — `AuthenticationSession.userCredentialId === this.id`.
- Verification tokens expire automatically — `VerificationToken.consume()` throws past `expiresAt`.
- Authentication never grants permissions directly — aggregate has no `permissions[]` field.

**Public methods** (all mutation flows through here — Article 13):
- `static register(id: string, email: EmailAddress, hashedPassword: HashedPassword | null): UserCredential` — records `CredentialRegistered` event.
- `static fromPersistence(props): UserCredential` — no events.
- `verifyEmail(): void` — sets `emailVerifiedAt`, records `EmailVerified` event.
- `changePassword(newHash: HashedPassword): void` — records `PasswordChanged` event, revokes all active sessions (except the current one, passed as parameter).
- `attemptPassword(plaintext: PlaintextPassword, hasher: PasswordHasher): Promise<boolean>` — verifies against `hashedPassword`; returns bool, records no event (Application Service records success/failure).
- `startSession(refreshTokenHash: string, expiresAt: Date, deviceLabel: string, ipAddress: string): AuthenticationSession` — returns the new session, records `SessionStarted` event.
- `rotateSession(oldSessionId: string, newRefreshTokenHash: string, expiresAt: Date): AuthenticationSession` — returns rotated session, records `SessionRotated`.
- `revokeSession(sessionId: string): void` — records `SessionRevoked`.
- `revokeAllSessions(): void` — logout everywhere; records one `AllSessionsRevoked`.
- `issueVerificationToken(purpose, tokenHash, expiresAt): VerificationToken` — records `VerificationTokenIssued`.
- `consumeVerificationToken(purpose, tokenHash, hasher): VerificationToken` — throws if not found/expired/consumed; records `VerificationTokenConsumed`.
- `linkProvider(provider: 'google', accountId: string): void` — records `ProviderLinked` (FR-001 groundwork, currently unused).
- `updateEmail(newEmail: EmailAddress): void` — called by subscriber when Profile's email changes; **resets** `emailVerifiedAt = null` and revokes sessions.

**Errors** (`domain/errors.ts`):
- `WeakPasswordError` (VALIDATION)
- `InvalidCredentialsError` (UNAUTHORIZED) — generic, no distinction between "user not found" and "wrong password" (BL-002)
- `EmailAlreadyVerifiedError` (CONFLICT)
- `VerificationTokenExpiredError` (VALIDATION)
- `VerificationTokenAlreadyConsumedError` (CONFLICT)
- `SessionNotFoundError` (NOT_FOUND)
- `SessionExpiredError` (UNAUTHORIZED)

### Domain Services

- `PasswordHasher` (interface) — `hash(plaintext): Promise<HashedPassword>`, `verify(plaintext, hashed): Promise<boolean>`. Infrastructure implements via argon2.
- `TokenHasher` (interface) — `hash(rawToken): string` (fast, one-way). Infrastructure implements via SHA-256 (raw refresh tokens and verification tokens are never stored in plaintext; only their hashes are).
- `RandomTokenGenerator` (interface) — `generate(bytes): string`. Infrastructure: `crypto.randomBytes` → base64url.

## 2. Domain Events

Ch.20 has zero events cataloged. This pass introduces the minimal set with plausible cross-context consumers:

- **`CredentialRegistered`** — payload `{userCredentialId, email}`. Emitted after successful registration. **No cross-context consumer yet** — kept because it's the audit-log entry for account creation.
- **`EmailVerified`** — payload `{userCredentialId, verifiedAt}`. **Consumer: Profile Domain** — subscribes and calls `VerifyIdentityService.execute(userCredentialId)`. This is the primary cross-context integration point.
- **`PasswordChanged`** — payload `{userCredentialId, changedAt}`. Emitted after successful password change or reset completion. No cross-context consumer required for Phase 0; retained for audit + future Notification Domain.
- **`SessionStarted`** — payload `{userCredentialId, sessionId, deviceLabel, occurredAt}`. Audit trail.
- **`SessionRevoked`** — payload `{userCredentialId, sessionId, reason}`. Audit trail.

**Deliberately NOT added** (Article 37): `SessionRotated`, `AllSessionsRevoked`, `ProviderLinked`, `AuthenticationFailed`, `VerificationTokenIssued`, `VerificationTokenConsumed`. These are internal implementation details with no confirmed cross-context consumer. Can be added later.

## 3. Repository

`domain/UserCredentialRepository.ts`:

```typescript
export interface UserCredentialRepository {
  findById(id: string): Promise<UserCredential | null>;
  findByEmail(email: string): Promise<UserCredential | null>;
  findByRefreshTokenHash(hash: string): Promise<UserCredential | null>;
  findByVerificationTokenHash(purpose, hash: string): Promise<UserCredential | null>;
  save(credential: UserCredential): Promise<void>;                    // insert on registration
  updateCredential(credential: UserCredential): Promise<void>;         // password/email changes
  updateSessions(credential: UserCredential): Promise<void>;           // session add/rotate/revoke
  updateTokens(credential: UserCredential): Promise<void>;             // verification token issue/consume
}
```

Same narrow-write pattern established by Profile. `PrismaUserCredentialRepository` uses `$transaction` for save; each `update*` method touches only its own child table plus `user_credentials.updatedAt`.

## 4. Application Services (one per use case — Article 24)

Files under `application/`:

- **`RegisterCredentialService`** — Full registration flow: validates email format, creates Profile via Profile Domain (calls `RegisterProfileService.execute`), creates UserCredential with hashed password, issues an email verification token, dispatches verification email (via `Mailer`). Returns `{userCredentialId}` — never distinguishes new vs. existing email in the response (BL-002).
- **`AuthenticateWithPasswordService`** — Given email + plaintext password, returns `{accessToken, refreshToken, session}`. Records `SessionStarted`. Returns generic `InvalidCredentialsError` for any failure.
- **`RefreshSessionService`** — Given refresh token, rotates it, returns new access + refresh. Enforces one-time use — a rotated token being reused triggers `revokeAllSessions()` (theft detection).
- **`LogoutService`** — Given session ID, revokes it.
- **`LogoutEverywhereService`** — Given user credential ID, revokes all sessions.
- **`RequestEmailVerificationService`** — Idempotent; issues a new token, sends email. Rate-limited.
- **`ConfirmEmailVerificationService`** — Consumes token, calls `credential.verifyEmail()`, publishes `EmailVerified`.
- **`RequestPasswordResetService`** — Idempotent; if email exists, issues token + sends email; if not, does nothing but returns same response (BL-002). Rate-limited.
- **`CompletePasswordResetService`** — Consumes token, updates password hash, revokes all sessions.
- **`ChangePasswordService`** — For authenticated users; requires current password, updates hash, revokes all sessions except current.

`application/subscribers/`:
- `verifyProfileOnEmailVerified.ts` — Subscribes to `EmailVerified`, calls Profile's `VerifyIdentityService.execute(userCredentialId)`. **Cross-context integration point.**
- `updateCredentialEmailOnProfileUpdated.ts` — Placeholder; Profile doesn't emit an `EmailChanged` event yet (email change is deferred to this domain per Profile blueprint decision 5), so this subscriber remains a stub. Documented.

`application/errors.ts`:
- `EmailAlreadyRegisteredError` (surfaced only in dev/tests — never returned to unauthenticated users)
- `RateLimitExceededError` (mapped to HTTP 429; new DomainErrorKind: `RATE_LIMITED` — need to extend `DomainErrorKind` union and `errorHandler`)

## 5. Infrastructure

`infrastructure/`:
- `PrismaUserCredentialRepository.ts` — Prisma implementation.
- `Argon2PasswordHasher.ts` — implements `PasswordHasher` via `argon2` package.
- `Sha256TokenHasher.ts` — implements `TokenHasher` via Node crypto.
- `CryptoRandomTokenGenerator.ts` — implements `RandomTokenGenerator` via Node crypto.
- `JoseJwtService.ts` — issues + verifies access tokens using `jose`. Reads `JWT_ACCESS_SECRET` from env; refuses to start if missing.
- `ConsoleMailer.ts` — dev implementation of `Mailer` interface, logs verification/reset links to server log. Production `Mailer` is deferred (backlog entry).

## 6. API Layer

`api/`:

### Endpoints (all under `/api/v1/auth`):
```
POST   /register                    → RegisterCredentialService (BL-002: generic response)
POST   /login                       → AuthenticateWithPasswordService (sets es_access + es_refresh cookies)
POST   /logout                      → LogoutService (clears cookies)
POST   /logout-everywhere           → LogoutEverywhereService
POST   /refresh                     → RefreshSessionService (rotates cookies)
POST   /email/request-verification  → RequestEmailVerificationService
POST   /email/verify                → ConfirmEmailVerificationService (public, token-based)
POST   /password/request-reset      → RequestPasswordResetService (BL-002: generic response)
POST   /password/reset              → CompletePasswordResetService (public, token-based)
POST   /password/change             → ChangePasswordService (authenticated)
GET    /me                          → returns current authenticated user's credential summary
```

### Middleware

`api/middleware/`:
- **`authenticate.ts`** — reads `es_access` cookie, verifies JWT via `JoseJwtService`, attaches `req.user = {id}` (Express type augmentation in a `.d.ts`). Does NOT throw on missing/invalid — sets `req.user = null` so protected route middleware can decide.
- **`requireAuth.ts`** — throws `UnauthorizedError` if `req.user == null`. Applied per-router or per-route.
- **`rateLimit.ts`** — factory wrapping `express-rate-limit`. Applied to `/register`, `/login`, `/request-verification`, `/request-reset`.

### DTOs, mappers, validators
Standard pattern established in Profile. `AuthMapper` produces `AuthenticatedUserResponseDto` (id, email, emailVerified, providers[]). Cookie writing lives in the controller (single place); everything else stays framework-agnostic.

### Wiring in `app.ts`
- `cookie-parser` middleware added before routes.
- New `AppDependencies` fields: `userCredentialRepository`, `passwordHasher`, `tokenHasher`, `randomTokenGenerator`, `jwtService`, `mailer`, `authConfig`.
- `authenticate` middleware mounted globally (attaches `req.user` if cookie present).
- Router mounted at `/api/v1/auth`.

## 7. Prisma Schema

Additive migration `add_authentication_domain`:

```prisma
model UserCredential {
  id              String    @id                     // matches User.id (Profile)
  email           String    @unique
  hashedPassword  String?                           // "argon2id$<hash>" — null for OAuth-only
  emailVerifiedAt DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  providers               AuthenticationProvider[]
  sessions                AuthenticationSession[]
  verificationTokens      VerificationToken[]

  @@map("user_credentials")
}

model AuthenticationProvider {
  id                String   @id @default(uuid())
  userCredentialId  String
  provider          String                          // 'password' | 'google'
  providerAccountId String                          // for password, same as email; for google, sub
  linkedAt          DateTime @default(now())

  credential UserCredential @relation(fields: [userCredentialId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("authentication_providers")
}

model AuthenticationSession {
  id                String    @id @default(uuid())
  userCredentialId  String
  refreshTokenHash  String    @unique               // SHA-256 hash of refresh token
  deviceLabel       String?
  ipAddress         String?
  createdAt         DateTime  @default(now())
  expiresAt         DateTime
  revokedAt         DateTime?

  credential UserCredential @relation(fields: [userCredentialId], references: [id], onDelete: Cascade)

  @@index([refreshTokenHash])
  @@index([userCredentialId])
  @@map("authentication_sessions")
}

model VerificationToken {
  id                String    @id @default(uuid())
  userCredentialId  String
  purpose           String                          // 'email_verification' | 'password_reset'
  tokenHash         String    @unique               // SHA-256 hash
  createdAt         DateTime  @default(now())
  expiresAt         DateTime
  consumedAt        DateTime?

  credential UserCredential @relation(fields: [userCredentialId], references: [id], onDelete: Cascade)

  @@index([tokenHash])
  @@map("verification_tokens")
}
```

**Backfill:** each existing `users` row gets a `user_credentials` row with `hashedPassword = NULL` and `emailVerifiedAt = NULL`. Existing users must go through password reset to gain a password — they can't log in until they do. This is acceptable because in production we have exactly one Walking-Skeleton-era test row.

## 8. Frontend

`apps/web/features/authentication/`:

- `types/index.ts` — `AuthenticatedUser`, `LoginInput`, `RegisterInput`, `PasswordResetInput`, etc.
- `api/authClient.ts` — `login()`, `register()`, `logout()`, `refresh()`, `requestPasswordReset()`, `completePasswordReset()`, `requestEmailVerification()`, `confirmEmailVerification()`, `getMe()`.
- `validation/` — Zod schemas mirroring backend for each form.
- `components/`:
  - `LoginForm.tsx`, `RegisterForm.tsx`, `PasswordResetRequestForm.tsx`, `PasswordResetForm.tsx`, `EmailVerificationBanner.tsx` (shown on `/profile` if email unverified).
- `hooks/useCurrentUser.ts` — client-side hook that calls `/api/v1/auth/me` on mount; returns `{user, isLoading, refresh}`. Simple fetch-on-mount pattern matching `ProfileDashboard` — deliberately not React Query in this pass.
- `index.ts` — barrel export.

**New routes:**
- `app/login/page.tsx`, `app/register/page.tsx`, `app/password/reset/request/page.tsx`, `app/password/reset/[token]/page.tsx`, `app/email/verify/[token]/page.tsx`.

**Existing route changes:**
- `app/profile/page.tsx` — after successful registration, prompt user to check email. No auto-redirect to a profile view (which requires login).
- `app/profile/[id]/page.tsx` — wrap with a check that `useCurrentUser()` returns a user whose id matches `[id]`, else redirect to `/login`. (Full authorization comes with the Authorization Domain later; this is a minimal "you can only edit your own profile" guard using authenticated identity, not policy.)

## 9. Build Sequence (8 reviewable steps)

1. **Deps + Prisma + secrets docs** — install `argon2`, `jose`, `cookie-parser`, `express-rate-limit` (+ types). Add JWT/cookie env vars to `.env.example`. Prisma schema + migration + backfill. `PrismaClient` regenerates.
2. **Domain layer** — VOs, entities, aggregate, errors, domain service interfaces. Full unit test coverage.
3. **Infrastructure implementations** — `Argon2PasswordHasher`, `Sha256TokenHasher`, `CryptoRandomTokenGenerator`, `JoseJwtService`, `ConsoleMailer`, `PrismaUserCredentialRepository` + `InMemoryUserCredentialRepository` test double.
4. **Application services** — all 10 services, each with unit tests using in-memory repo + recording publisher + fake hasher/mailer.
5. **API layer + middleware** — controllers, DTOs, mappers, validators, `authenticate`/`requireAuth`/`rateLimit` middleware, cookie writing, routes. HTTP-level tests against `createApp` with fakes. Extend `DomainErrorKind` union with `RATE_LIMITED` → 429.
6. **Cross-context subscriber** — wire `verifyProfileOnEmailVerified` in the composition root (`server.ts`). Integration test proving `EmailVerified` → `User.verifiedAt` set.
7. **Frontend** — types, client, validation, hooks, components, routes. Component tests for each form.
8. **Docs closeout** — Canonical Spec §6 adds 5 Auth events + moves Auth out of §6.3 pending list; new resolution log entry; TECHNICAL_BACKLOG marks BL-002 resolved, updates BL-006/BL-007/FR-001 status; add new BL entries for deferred items (production mailer, Redis rate-limit backing store, MFA, refresh-token theft alerting).

Each step ends with typecheck + tests + lint clean. Step 5 also runs the API against curl to sanity-check the cookie flow.

## 10. Test Strategy

- **Domain:** per-VO + per-entity + full aggregate. Every invariant from Ch.20 must have a test that names it.
- **Application:** in-memory repo + recording event publisher + fake `PasswordHasher`/`Mailer`/`JwtService`. Cover happy path, wrong-password, expired-token, rate-limit, theft-detection.
- **Infrastructure:** integration tests for `PrismaUserCredentialRepository` (round-trip + transactional atomicity). `Argon2PasswordHasher` has one test proving `hash().verify() == true` and one proving `verify(wrong) == false` — algorithm correctness is trusted to `argon2` itself, not re-derived.
- **API:** supertest against `createApp` with fakes. Login sets cookies, refresh rotates cookies, logout clears cookies, protected routes 401 without cookie, rate limit returns 429.
- **Cross-context:** end-to-end test with real subscribers wired: register → grab verification token → confirm → assert `User.verifiedAt` was set on the Profile aggregate.
- **Frontend:** component tests for each form.

## 11. Explicit Call-Outs

- **BL-002 (account enumeration) — CLOSED here.** Register/login/reset endpoints return generic responses; rate limited.
- **BL-006 (helmet) — already resolved.** Update backlog text to reflect current state.
- **BL-007 (rate limiting) — PARTIALLY closed.** In-memory limiter is in place for auth endpoints; Redis-backed store for multi-instance deployments remains open. New backlog entry.
- **FR-001 (Google OAuth) — policy decided, code deferred.** Account-linking rule ("auto-link on verified-email match") recorded in the Canonical Spec resolution log.
- **New backlog entries this pass introduces:**
  - Production email delivery (SMTP/SES/Postmark integration to replace `ConsoleMailer`).
  - Redis-backed rate limiting for multi-instance deployments.
  - MFA support (Ch.20 concept 1 lists MFA; deferred to future scope per Ch.20 itself).
  - Refresh-token theft alerting (currently just revokes; should notify).
  - Session listing / device management UI.
- **Constitution spec discrepancy noted:** Roadmap §3.2 references *"Article 'Credential Protection'"* but no such article exists in `Constraint.pdf`. The intent is served by Ch.20 Security Principles + Article 41 Security Gate + Part VI "Never Ever" list. Flag for the user; no action required.
- **Canonical Spec amendments needed:**
  - §2.1: add VO list to `UserCredential` row (`HashedPassword, PlaintextPassword, EmailAddress`).
  - §6.1: add 5 events + move Authentication out of §6.3.
  - §6.2: new resolution entry (6.2.4) recording FR-001 account-linking policy + why other events were deferred.

## Verification

After each build step:
- `npm test` (both apps).
- `npm run typecheck` (both apps).
- `npm run lint` (web only — api has no lint script yet, per an earlier finding).

After Step 5:
- Manual curl walkthrough: register → check server log for verification link → confirm → login → hit `/me` with cookie → refresh → logout → confirm cookie cleared.

After Step 6:
- Cross-context integration test proves EmailVerified subscriber wires correctly and flips Profile's `verifiedAt`.

After Step 7:
- Browser smoke test against the local API: register → verify email (dev link from logs) → log in → land on `/profile/[id]` → confirm authenticated identity.
