# EventSphere — Technology Stack

**Purpose:** This file tells an implementer (human or AI) exactly which technologies and versions to use. `SystemDesign.md` tells you how the system is designed; this file tells you which concrete package versions to install. Keep them separate.

**Currency note:** Baselines below reflect the last stable releases known as of this document's authoring. Package ecosystems move fast — confirm the actual latest stable release for each item before running `npm/pnpm init`, rather than trusting these numbers blindly if significant time has passed since this file was written.

**Update (Walking Skeleton scaffold):** versions below marked ✅ are what was actually installed when the project was scaffolded — confirmed, not projected. Next.js resolved to 16.x, notably newer than the 15.x baseline originally guessed; it ships its own `AGENTS.md` in `apps/web/` warning of breaking changes versus older training data — read that (and `node_modules/next/dist/docs/`) before writing App Router code.

---

## Runtime & Tooling

| Item | Version | Notes |
|---|---|---|
| Node.js | ✅ 20.19.0 (LTS, installed) | Original recommendation was 22.x; 20 was already installed and is still Active LTS, so used as-is to avoid setup friction. Bump later if desired. |
| Package Manager | ✅ pnpm 9.15.9 (installed) | Installed directly via `npm install -g pnpm@9` — Corepack's bundled pnpm shim had a bug against this Node patch version (`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`) and was removed. |
| TypeScript | ✅ 5.9.3 (web) / ^5.7.2 (api) | Strict mode enabled project-wide (required — Constitution Article 27, no `any` without approval) |

## Frontend

| Item | Version | Notes |
|---|---|---|
| Next.js | ✅ 16.2.12 (installed) | App Router only, per `SystemDesign.md`. Newer than the 15.x baseline — ships breaking changes vs. older docs, see currency note above |
| React | ✅ 19.2.4 (installed) | Matches Next.js 16's peer dependency |
| Tailwind CSS | ✅ v4.3.3 (installed) | Confirmed — CSS-based config, no `tailwind.config.js`. shadcn/ui v4 compatibility still to be verified when we add it |
| shadcn/ui | ✅ CLI 4.16.1 (initialized) | Components are copied into the repo via the CLI, not installed as an ongoing dependency. **Tailwind v4 compatibility confirmed** — the CLI explicitly validated "Found v4" during init, so no stack substitution was needed. |
| shadcn UI foundation | ✅ **Base UI** (`@base-ui/react` ^1.6.0) | **Decision:** the shadcn CLI now offers `base \| radix \| aria` and defaults to Base UI (preset `base-nova`); shadcn historically used Radix. We keep the current official default to stay aligned with the ecosystem rather than overriding it. Revisit only if a concrete limitation appears during implementation. |
| TanStack Query | v5.x | |
| TanStack Table | v8.x | |
| React Hook Form | v7.x | |
| Zod | v3.x | |
| Recharts | v2.x | |
| Lucide React | Latest | |

## Backend

| Item | Version | Notes |
|---|---|---|
| Express.js | ✅ ^4.21.2 (installed) | Stayed on v4 — the safer, more battle-tested default |
| Prisma | ✅ 6.19.3 (installed) | |

## Database & Caching

| Item | Version | Notes |
|---|---|---|
| PostgreSQL | 16.x | Neon-managed; 17.x is a viable alternative if fully supported by Neon at setup time |
| Redis | ✅ Railway Redis plugin (installed) | Provisioned as a Railway service in the same project; `REDIS_URL` referenced into the API service's env (`${{Redis.REDIS_URL}}`), not hand-copied. Client: `ioredis` ^6, plus `rate-limit-redis` ^6 for the rate-limit store. |

## AI

| Item | Version | Notes |
|---|---|---|
| Gemini API | Latest stable model at integration time | Confirm current recommended model name/version directly from Google's documentation when Phase 4 begins — model names and versions change independently of this document. |

## Deployment Providers (no version — provider choice)

| Concern | Provider |
|---|---|
| Frontend hosting | Vercel |
| Backend hosting | Railway / Render / Docker |
| Database hosting | Neon (managed PostgreSQL) |
| Object storage | Cloudinary |
| Monitoring | OpenTelemetry + Grafana + Prometheus |
| Logging | Winston / Pino |

---

## Before You Run `init`

Two items above are flagged as recommendations rather than settled facts — confirm before locking `package.json`:
1. **Package manager** (pnpm vs. npm)
2. **Tailwind v4** (vs. staying on v3 if v4/shadcn compatibility isn't where you want it yet)

Everything else is a standard version lookup, not a decision — verify current stable numbers at setup time and update this file to match what's actually installed.
