# Walking Skeleton — Frontend Implementation Plan

**Status:** Draft — pending approval. No code written yet.
**Scope:** Frontend half of the Walking Skeleton only. Backend is frozen (Roadmap 3.1.1).

**Next.js 16 verification:** `AGENTS.md` and bundled docs read before planning. Relevant confirmations: Turbopack is default (no flag), `next lint` is removed in favour of the ESLint CLI (our scripts already comply), and `'use client'` marks the Server/Client boundary. Async Request APIs (`cookies`, `headers`, `params`) and the `middleware`→`proxy` rename don't affect this slice but **will** affect Phase 0 authentication.

---

## 1. Route Structure

Single route: **`/profile`**.

| File | Type | Purpose |
|---|---|---|
| `app/layout.tsx` | Server Component (existing) | Root layout — unchanged |
| `app/profile/page.tsx` | **Server** Component | Route entry; renders heading + the client form. Server by default per Next.js 16 |
| `app/profile/RegisterProfileForm.tsx` | **Client** Component (`'use client'`) | All interactivity: form state, submission, result rendering |

Rationale for the split: only the interactive form needs client JavaScript. Keeping `page.tsx` a Server Component follows the documented guidance to push `'use client'` down to the specific interactive component rather than marking whole routes.

`app/page.tsx` (the default Next.js landing page) stays untouched — out of scope.

## 2. API Client

`lib/api/profileClient.ts` — a thin, typed `fetch` wrapper. No business logic (Constitution Article 29).

Responsibilities:
- `POST {API_BASE_URL}/api/v1/profile` with a JSON body
- Return a typed discriminated union rather than throwing:
  `{ ok: true, data: ProfileResponse } | { ok: false, error: ApiError }`
- Translate the backend's `{ error, message }` envelope into `ApiError`
- Handle network failure (backend unreachable) as a distinct error case

Types mirror the backend's `ProfileResponseDto` shape. **These are hand-written, not shared via a workspace package** — deliberate: coupling `apps/web` to `apps/api`'s internals would violate the API-First boundary in `SystemDesign.md`. Contract sharing (OpenAPI-generated types) is a later concern; noted for the backlog.

Base URL comes from `NEXT_PUBLIC_API_URL` (browser-exposed by necessity, since the fetch runs client-side), defaulting to `http://localhost:4000`.

## 3. Form Architecture

**React Hook Form + Zod** via `@hookform/resolvers`, per `SystemDesign.md`.

```
RegisterProfileForm (Client Component)
├── useForm<RegisterProfileInput>({ resolver: zodResolver(schema) })
├── onSubmit → profileClient.register()
└── local state: 'idle' | 'submitting' | 'success' | 'error'
```

Fields: `email`, `name`. Submit button.

**Explicitly rejected — Server Actions.** They'd insert the Next.js server as a second hop between browser and Express, contradicting the API-First design in `SystemDesign.md` and rendering the CORS work (C1) pointless — CORS exists precisely because the *browser* calls the API directly. Client-side fetch is the architecturally intended path.

## 4. Validation Flow

Two layers, mirroring the backend's Article 23 split:

| Layer | Checks | Enforced by |
|---|---|---|
| Client (RHF + Zod) | Required fields, email format, non-empty name | Fast feedback only |
| Server (frozen backend) | Same format rules **plus** uniqueness | Authoritative |

The client schema is a **UX convenience, never a security boundary** (Constitution Article 29: "Assume UI validation is sufficient" is forbidden). The backend re-validates everything; a duplicate email is only discoverable server-side and surfaces as a `409`.

## 5. Loading / Success / Error States

| State | UI |
|---|---|
| `idle` | Form enabled, no result panel |
| `submitting` | Submit disabled + spinner; inputs disabled to prevent double-submit |
| `success` | Result panel showing returned `id`, `email`, `name`, `createdAt`; form cleared |
| `error` — field | Inline message under the offending input (client validation) |
| `error` — conflict (409) | Form-level message: "That email is already registered." |
| `error` — network | Form-level message: "Couldn't reach the server. Is the API running?" |
| `error` — unexpected (500) | Generic message; no stack traces or internal detail exposed |

Error copy is mapped from the backend's stable `error` **code** (e.g. `EMAIL_ALREADY_REGISTERED`), not its human-readable `message` — the code is the contract, the message is not.

## 6. Folder Structure

```text
apps/web/
├── app/
│   ├── layout.tsx                        # existing
│   ├── page.tsx                          # existing, untouched
│   ├── globals.css                       # existing
│   └── profile/
│       ├── page.tsx                      # Server Component
│       └── RegisterProfileForm.tsx       # 'use client'
├── lib/
│   ├── api/
│   │   ├── profileClient.ts              # fetch wrapper
│   │   └── types.ts                      # ProfileResponse, ApiError
│   └── validation/
│       └── registerProfileSchema.ts      # Zod schema
├── .env.local.example                    # documents NEXT_PUBLIC_API_URL
└── package.json
```

Flat and minimal, matching the "smallest possible slice" mandate. No premature `components/ui` scaffolding beyond what shadcn generates.

## 7. Integration With Existing Backend

| Concern | Resolution |
|---|---|
| Endpoint | `POST /api/v1/profile` (frozen, unchanged) |
| CORS | Backend allow-lists `http://localhost:3000` by default (C1) — matches Next.js dev port |
| Ports | Web `3000`, API `4000` — no conflict |
| Credentials | Not used yet; `credentials: true` already configured server-side for Phase 0 |
| Contract | Success `201` → `{id, email, name, createdAt}`; failures → `{error, message}` with `400` / `409` / `500` |

**No backend changes required.** If this slice appears to need one, that's a signal to stop and raise it, per the freeze discipline.

## 8. Testing

| Test | Tool |
|---|---|
| Zod schema accepts/rejects correct inputs | Vitest |
| `profileClient` maps 201 / 409 / network failure to the right union variant | Vitest + mocked `fetch` |
| Manual end-to-end: real browser → real API → real Neon row | Manual |

Component-level rendering tests (Testing Library) are deliberately excluded — that's a heavier dependency set than a wiring proof warrants. Flagged for the backlog rather than silently skipped.

## 9. Open Decisions

**9.1 — TanStack Query: include or defer?**
`SystemDesign.md` names it the state-management choice, but the approved Walking Skeleton blueprint (Section 10) specified only React Hook Form + Zod + shadcn/ui. For a single POST with no cached server state, `useMutation` adds a dependency for little benefit here — though including it would validate that part of the stack.
**Recommendation: defer to Phase 0**, where real queries and caching exist. Plain `useState` covers this slice.

**9.2 — shadcn/ui with Tailwind v4: verify before relying on it.**
`TECH_STACK.md` flags shadcn's Tailwind v4 compatibility as unverified. The plan assumes shadcn works; if `shadcn init` fails against Tailwind 4.3.3, the fallback is plain Tailwind-styled elements for this slice, with shadcn revisited in Phase 0 when the component library actually matters.
**Recommendation: attempt `shadcn init` first, fall back only if it genuinely breaks** — and report either way rather than silently substituting.

---

---

## 10. Implementation Progress

### ✅ Step 1 — Project Setup Verification (FROZEN)

Approved by project owner. Delivered:
- Verified baseline: Next.js 16.2.12, React 19.2.4, Tailwind v4.3.3, TypeScript strict
- shadcn/ui initialized — **Tailwind v4 compatibility confirmed** (Decision 9.2 resolved empirically; no substitution needed). Components: `button`, `input`, `label`, `card`
- Form dependencies: `react-hook-form`, `zod`, `@hookform/resolvers`. **No TanStack Query** (Decision 9.1 honoured)
- `.env.local.example` documenting `NEXT_PUBLIC_API_URL`
- Type-check clean, production build passing, dev server serving HTTP 200

**Two infrastructure defects found and fixed:**
1. Next.js inferred `~/package-lock.json` (outside the project) as workspace root — mis-scopes module resolution and file tracing, and typically fails at deploy time rather than locally. Fixed by pinning `turbopack.root`.
2. `create-next-app`'s `.gitignore` pattern `.env*` swallowed `.env.local.example`. Fixed with negation patterns; verified via `git ls-files` that real env files stay ignored while templates are tracked.

**UI foundation decision:** Base UI (`@base-ui/react`) retained as shadcn's current official default rather than overriding to Radix. Recorded in `TECH_STACK.md`.

### ✅ Step 2 — API Client (FROZEN)

Approved by project owner. Delivered `lib/api/{types,config,http,profileClient}.ts` — centralized transport, discriminated-union results, classified errors, env-based URL, 10s timeout. 19/19 unit tests; all four paths (success / 409 / 400 / network-down) verified against the live Express backend. Backend freeze respected (zero changes to `apps/api/src/`).

### ✅ Step 3 — `/profile` Route (FROZEN)

Approved by project owner. Delivered `app/profile/page.tsx` — Server Component shell with Card container, page layout, and placeholder sections for the form (Step 4) and result panel (Step 7). Route registered as `○ (Static)`, HTTP 200, content confirmed in server-rendered HTML. Verified absent: `'use client'` directive, React hooks, client state, API imports. Accessibility: `aria-labelledby` with screen-reader-only headings.

### ✅ Step 4 — Registration Form (FROZEN)

Approved by project owner. Delivered `app/profile/ProfileRegistrationForm.tsx` — `'use client'` component with React Hook Form, email/name inputs, submit button; mounted into the page shell with `page.tsx` remaining a Server Component.

**Naming note:** the component is `ProfileRegistrationForm` per the project owner's Step 4 instruction, superseding the `RegisterProfileForm` name used in Section 1 of this plan.

**Key risk resolved empirically:** RHF's `register()` ref-forwarding works correctly through Base UI's `Input` (shadcn now wraps Base UI, not Radix). Verified in a real browser — values captured, no navigation, no reload, no console errors.

**Incidental fix:** configured ESLint `argsIgnorePattern: "^_"` project-wide; verified the rule still catches genuine unused variables.

### ✅ Step 5 — Client-Side Validation (FROZEN)

Approved by project owner. Delivered `lib/validation/registerProfileSchema.ts` (Zod, with `.trim()`/`.toLowerCase()` normalisation mirroring the backend) wired via `zodResolver`, plus inline field errors with `aria-invalid` / `aria-describedby` / `role="alert"`.

**Client/server parity verified empirically:** 12 inputs run through both the real backend `User.register()` aggregate and the client schema — **0 mismatches**. No input can be accepted by one layer and rejected by the other.

**RHF behaviour retained by decision:** `mode: "onBlur"`, `reValidateMode: "onChange"`. Before first submit, a corrected field's error clears on blur rather than on keystroke — standard RHF semantics, accepted unless usability testing suggests otherwise.

**Verification-method lesson:** the browser tool's `form_input` sets `.value` via the DOM, which React/RHF does not observe, producing a false "validation bug" signal. Real keyboard/click events must be used for anything React-stateful.

### ✅ Step 6 — API Integration (FROZEN)

Approved by project owner. `onSubmit` wired to `registerProfile()`, both `ApiResult` branches handled explicitly (convention 11.5).

**Verified in-browser against the live backend** — including the **CORS preflight** (`OPTIONS → 204`), exercised for the first time here (supertest and server-to-server calls don't trigger preflight). `POST → 201` on success, `→ 409` on duplicate; backend domain event fired with `userId` matching the response `id`; no console errors.

### ✅ Step 7 — Loading, Success & Error States (FROZEN)

Approved by project owner. Delivered `lib/api/errorMessages.ts` (centralised code → copy mapping, feature overrides with kind-based fallbacks) plus loading/success/error presentation.

**Design decisions endorsed in review:** loading derived from RHF `isSubmitting` rather than duplicated state; outcome modelled as a discriminated union so contradictory states are unrepresentable; persistent live region (a conditionally-mounted region would silently drop screen-reader announcements).

**All three states browser-verified:** loading captured mid-flight via `MutationObserver` (`"Registering…"`, button disabled, `aria-busy="true"`, inputs disabled); success panel with all four fields; conflict error showing mapped copy; network error with the backend stopped. Convention 11.3 verified — the backend's raw message and the submitted email are both absent from displayed error text.

**Bug caught by visual verification:** a stale Step 3 placeholder (*"Result panel — implemented in Step 7."*) was still rendering in `page.tsx` while **every programmatic DOM assertion passed**. Only a screenshot exposed it. Recorded as evidence in BL-009 (component tests).

### ⏭️ Step 8 — End-to-End Verification (PARTIALLY DEFERRED)

Browser → API → backend fully verified (Steps 6–7). The remaining **browser → Neon** assertion is deferred by project-owner decision pending network access to Neon; the router in use blocks outbound port 5432.

**Not a feature dependency.** The database path is already independently proven: 3/3 repository integration tests against live Neon, plus a full-stack check during the backend freeze confirming a real row with matching IDs. What remains is confirming that same path once *through the browser* — an infrastructure confirmation, not unvalidated functionality.

### ✅ Step 9 — Frontend Architecture Review (COMPLETE)

Conclusion: **⚠️ Approved with Minor Improvements**. Zero Constitution violations; dependency direction verified acyclic and inward-only; `lib/api` and `lib/validation` confirmed framework-free; no `any`; React auto-escaping intact; only `NEXT_PUBLIC_*` env access.

All six findings are forward-looking (scaling to Phase 0) rather than defects in this slice, and are recorded as **BL-008 … BL-013**. BL-008 (no frontend folder convention) is flagged as **blocking Phase 0** and will be resolved by amending Canonical Architecture Specification §7.

### ✅ Step 10 — Frontend Walking Skeleton (FROZEN)

Frozen by project owner following the Step 9 review. Changes to frozen frontend code now require the same explicit-approval discipline applied to the backend and to architecture documents — raise the issue rather than modifying silently.

---

## 11. Frontend Error-Handling Conventions

Standing rules for all frontend work, derived from the Step 2 review.

### 11.1 Two Distinct Validation Layers

The backend validates twice, and the two layers produce **different error codes**. This separation is intentional (Constitution Article 23) and must be preserved, not collapsed.

| Layer | Owner | Example code | Meaning |
|---|---|---|---|
| **Request/transport validation** | Backend Zod validator middleware | `VALIDATION_ERROR` | The request was *malformed* — wrong shape, missing field, wrong type. Rejected before reaching the domain. |
| **Domain validation** | Backend aggregate (e.g. `User.register()`) | `INVALID_EMAIL`, `INVALID_NAME` | The request was well-formed but violates a *business rule*. |

**Why it matters:** a malformed request never reaches the Domain layer, so a syntactically invalid email surfaces as `VALIDATION_ERROR`, not `INVALID_EMAIL`. Both are legitimate; the UI must handle both and must not assume one implies the other.

**Implication for UI work:** never rely on a specific code being returned for a given bad input — the layer that catches it first determines the code. Map defensively, and always provide a sensible fallback message for unrecognised codes.

### 11.2 Switch on `code`, Never on `message`

`ApiError.code` is the **stable contract**. `ApiError.message` is a human-readable diagnostic for logs and may change at any time without notice.

```ts
// ✅ correct
if (error.code === 'EMAIL_ALREADY_REGISTERED') { … }

// ❌ forbidden — brittle, breaks on any backend copy change
if (error.message.includes('already registered')) { … }
```

### 11.3 Never Display Raw Backend Messages

Backend `message` values are diagnostic and may leak internal detail (identifiers, constraint names, stack context). The UI maps `code` → its own user-facing copy. Unrecognised codes fall back to a generic message; the raw `message` may be logged, never rendered.

### 11.4 Client Validation Is UX Only, Never a Security Boundary

Zod schemas on the client exist for fast feedback. The backend re-validates everything and is authoritative. Constitution Article 29 explicitly forbids assuming UI validation is sufficient.

### 11.5 Handle Every `ApiResult` Branch Explicitly

`ApiResult` is a discriminated union precisely so the compiler forces both paths to be considered. Never cast it away or assume success.

---

*Both open decisions (9.1, 9.2) are now resolved.*
