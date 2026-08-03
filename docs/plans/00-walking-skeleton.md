# Walking Skeleton — Implementation Blueprint

**Status:** Draft — pending approval. No code written yet.

**Governing documents:** Canonical Architecture Specification (Section 1.1 Profile Domain, Section 2.1 User aggregate), AI Engineering Constitution (Articles 11–16, 21–28, 36), `SystemDesign.md`, `TECH_STACK.md`, `ImplementationRoadmap.md` Section 3.1. No new architecture introduced; no bounded context simplified beyond what the Roadmap already scoped for this phase.

---

## 1. Goal of the Walking Skeleton

Validate that the complete technology stack — Next.js frontend, Express backend, Prisma/PostgreSQL persistence, and the Constitution's layering rules — works correctly end-to-end, on **real deployed infrastructure**, before committing to building 15 bounded contexts against the pattern. This is a wiring proof, not a feature delivery. Success is measured by "does a request survive the full round trip correctly," not by how much of Profile Domain is implemented.

## 2. Exact Functionality That Will Exist

**In scope:**
- A single web page where a user submits an email and a name
- The backend creates a minimal `User` record
- The created record (id, email, name, createdAt) is returned and rendered on the page

**Explicitly out of scope for this phase** (to keep the boundary unambiguous):
- No authentication or authorization of any kind
- No full Ch.19 Profile Domain scope (`UserProfile`, `UserPreferences`, avatar, bio, etc.) — that is Phase 0
- No update/delete operations — create-only
- No additional API endpoints beyond the single one below
- No other bounded context is touched

## 3. Folder Structure

Monorepo via pnpm workspaces (`TECH_STACK.md`) — two deployable apps.

```text
eventsphere/
├── apps/
│   ├── web/                          # Next.js frontend (Vercel)
│   │   ├── app/
│   │   │   ├── profile/
│   │   │   │   └── page.tsx          # form + result display
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── lib/api/profileClient.ts  # fetch wrapper calling the backend
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── api/                          # Express backend (Railway/Render)
│       ├── src/
│       │   ├── modules/profile/
│       │   │   ├── domain/
│       │   │   │   ├── User.ts               # aggregate root
│       │   │   │   └── ProfileRepository.ts   # repository interface
│       │   │   ├── application/RegisterProfileService.ts
│       │   │   ├── infrastructure/PrismaProfileRepository.ts
│       │   │   ├── controller/ProfileController.ts
│       │   │   ├── routes/profile.routes.ts
│       │   │   ├── dto/
│       │   │   │   ├── RegisterProfileRequestDto.ts
│       │   │   │   └── ProfileResponseDto.ts
│       │   │   ├── mapper/ProfileMapper.ts
│       │   │   └── validators/registerProfile.validator.ts
│       │   ├── infrastructure/prisma/client.ts   # shared Prisma client
│       │   ├── shared/{errors,logger}/           # minimal scaffolding
│       │   ├── app.ts
│       │   └── server.ts
│       ├── prisma/schema.prisma
│       ├── package.json
│       └── tsconfig.json
│
├── docs/
├── pnpm-workspace.yaml
└── package.json
```

Only `modules/profile/` is populated. This establishes the exact module template every subsequent bounded context follows starting in Phase 0.

## 4. Database Schema (Prisma)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

Minimal — not the full Ch.19 schema. Uniqueness on `email` is the primary enforcement mechanism for the "Unique Email" invariant.

## 5. Domain Model

**Aggregate Root:** `User` (Profile Domain — Canonical Architecture Specification, Section 2.1)

- `id: string` — UUID, immutable after creation
- `email: string` — format-validated at construction
- `name: string` — non-empty

**Factory:** `User.register(email, name): User` — validates and constructs. No mutation methods yet (create-only slice).

Email uniqueness is a set-level invariant, not something a single `User` instance can enforce — it is guarded by the database's unique constraint, with the Application Service responsible for translating a violation into a meaningful domain-level error rather than leaking a raw Prisma error (Constitution Article 28).

## 6. Repository Interfaces

Domain layer interface, Infrastructure layer implementation (Constitution Articles 16, 26 — one repository per aggregate, no generic/base repository):

```text
interface ProfileRepository {
  findByEmail(email: string): Promise<User | null>
  save(user: User): Promise<void>
}
```

`PrismaProfileRepository implements ProfileRepository` is the only file in this slice permitted to import the Prisma client.

## 7. Application Services

`RegisterProfileService` — one use case (Constitution Article 24):

1. `repository.findByEmail(email)` — if found, throw a translated `EmailAlreadyRegisteredError`
2. `User.register(email, name)`
3. `repository.save(user)` — the DB unique constraint is the final guard even if step 1 races
4. Return the created `User`

No business-rule decisions are made here — only orchestration and error translation (Article 14).

## 8. API Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/v1/profile` | Register a minimal profile |

Request: `{ email: string, name: string }` → Response `201`: `{ id, email, name, createdAt }`. No `GET` endpoint — the frontend renders directly from the `POST` response.

## 9. DTOs

- `RegisterProfileRequestDto { email: string; name: string }`
- `ProfileResponseDto { id: string; email: string; name: string; createdAt: string }`

Validated with Zod (already in the stack for frontend forms — reusing it backend-side avoids introducing a second validation library, per Constitution Article 37). `ProfileMapper.toResponseDto(user)` is the only place a domain object is converted to a transportable shape; the domain object itself is never returned from a controller (Articles 21, 22).

## 10. Frontend Pages

**Single page:** `/profile` (Next.js App Router).

- Form: email field, name field — React Hook Form + Zod (client-side validation mirrors the backend schema, per `SystemDesign.md`)
- shadcn/ui form components for inputs, button, and error/success states
- On submit: calls `profileClient.register()` → `POST /api/v1/profile`
- **Loading state:** button disabled + spinner while the request is in flight
- **Success state:** renders the returned profile (id, email, name, createdAt) below the form
- **Error state:** renders the backend's validation or duplicate-email error message inline — no raw stack traces or technical error text surfaced to the user

No routing beyond this single page is needed for this phase.

## 11. Authentication Flow

**None.** Authentication Domain is Phase 0 scope (Roadmap Section 3.2), not the Walking Skeleton. The single endpoint here is intentionally unauthenticated — adding auth now would expand this slice beyond "smallest possible" and couple it to a bounded context (Authentication) that doesn't exist yet. This is a deliberate boundary, not an oversight.

## 12. Sequence Diagram — Request Lifecycle

```text
Browser (Next.js /profile page)
    │  user submits form
    ▼
profileClient.register(email, name)
    │  fetch POST /api/v1/profile
    ▼
Express Router (routes/profile.routes.ts)
    ▼
Zod Validator (validators/registerProfile.validator.ts)
    │  reject with 400 if malformed → short-circuits here
    ▼
ProfileController
    │  translates HTTP request → calls Application Service only
    ▼
RegisterProfileService (Application layer)
    │  1. repository.findByEmail(email)
    ▼
PrismaProfileRepository (Infrastructure layer)
    │  queries Postgres via Prisma
    ▼
PostgreSQL (Neon)
    │  returns null (no existing user) or existing row
    ▼
RegisterProfileService
    │  2. User.register(email, name)          — Domain layer, pure logic
    │  3. repository.save(user)                — back through Infrastructure → Postgres
    │  4. returns created User
    ▼
ProfileController
    │  ProfileMapper.toResponseDto(user)
    ▼
Express Router
    │  201 response with ProfileResponseDto
    ▼
profileClient.register() resolves
    ▼
Next.js page renders the created profile
```

Every arrow crosses exactly one architectural boundary in the direction Constitution Article 11 requires — inward toward the domain, then back outward through the same layers, never skipping a layer (e.g. Controller never touches Prisma directly).

## 13. Domain Events

Profile Domain is classified **Event Modeling Pending** (Canonical Architecture Specification, Section 6.3) — no events exist for it yet anywhere. Roadmap Section 3.1's literal deliverable list doesn't require one.

**Recommendation (carried over from the prior plan, still unconfirmed): include a minimal `ProfileRegistered` event**, published via a simple in-process event emitter — no Kafka/RabbitMQ needed at this stage (Ch.42's "Stage 1 — Modular Monolith" characteristics). Rationale: the Event Bus is part of "the entire stack" this phase exists to prove, and Phase 0 onward depends on this pattern working — better to validate it now, on the simplest aggregate, than for the first time on a more complex context.

If you'd rather keep the skeleton to exactly the Roadmap's literal scope (request → domain → DB → response, no event), say so and I'll drop this from the blueprint. Proceeding with the recommendation unless you override it.

## 14. Testing Strategy

| Layer | Test | Tooling |
|---|---|---|
| Domain | `User.register()` rejects invalid email/empty name; produces a correct instance for valid input | Vitest *(recommended, unconfirmed)* |
| Infrastructure | `PrismaProfileRepository.save()`/`findByEmail()` against a real test database, including the unique-constraint-violation path | Vitest + a Neon branch *(recommended, unconfirmed)* |
| Application | `RegisterProfileService` with a mocked repository — happy path and duplicate-email path | Vitest |
| API | `POST /api/v1/profile` — 201 with correct shape; 400 for invalid input | Vitest + supertest |
| End-to-end | Full path against the **real deployed** Vercel + Railway/Render + Neon URLs, matching Roadmap 3.1's acceptance criteria | Manual, or scripted with Playwright if you want it repeatable |

Same two flags as before, still open: **Vitest vs. Jest**, and **Neon test branch vs. local Docker Postgres**. Proceeding with the recommended defaults (Vitest, Neon branch) unless you override.

## 15. Deployment Strategy

1. Provision a Neon PostgreSQL project/branch; store the connection string as an environment variable (never committed)
2. Deploy an **empty/stub** Express app to Railway/Render and an **empty** Next.js app to Vercel first — this surfaces any infrastructure or environment-configuration problems before any real code exists, when the blast radius is zero
3. Wire environment variables on both platforms (`DATABASE_URL` on the backend; the backend's public URL as `NEXT_PUBLIC_API_URL` or equivalent on the frontend)
4. Run the Prisma migration against the Neon database
5. Implement per Section 3's sequence (Domain → Repository → Application → DTO/Mapper/Validator → Controller/Routes → Frontend)
6. Push to trigger redeployment on both platforms (Vercel and Railway/Render both redeploy automatically on push to the connected branch, by default)
7. Run the end-to-end acceptance check against the **live** URLs — not localhost

## 16. Exit Criteria — Definition of Done

(Restated from Roadmap Section 3.1, for a self-contained blueprint.)

- [ ] Domain layer has zero imports of Prisma, Express, or any frontend library
- [ ] Repository is the only code that calls Prisma
- [ ] Controller contains no business logic, only request translation
- [ ] No `any` types used without explicit approval
- [ ] Every test in Section 14 exists and passes
- [ ] A request made against the **deployed** frontend URL creates a real row in the **deployed** Postgres database, and the created profile renders on screen
- [ ] Code reviewed against Constitution Articles 11–16 and 21–22

Only once every box above is checked does Phase 0 begin.

---

*Awaiting approval. Two items remain flagged rather than silently decided: Section 13 (domain event — proceeding with the recommendation unless overridden) and Section 14 (testing framework/database — proceeding with the recommendation unless overridden). Say the word and implementation starts.*
