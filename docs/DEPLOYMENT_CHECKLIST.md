# EventSphere — Production Deployment Checklist

**Scope:** Walking Skeleton deployment to Railway (API) + Vercel (Web) + Neon (database).
**Status:** Pre-deployment review complete. **2 blockers must be fixed before deploying.**
**Verdict:** ⚠️ **Not deployable as-is** — see Blockers.

---

## Summary

| Area | Status |
|---|---|
| Secrets hygiene | ✅ Verified clean — zero credentials in git history |
| Environment variables | 🔴 1 undocumented variable (`CORS_ORIGINS`) |
| API build for deployment | 🔴 Will fail — Prisma client never generated |
| Web build | ✅ Passes |
| Migrations | 🟠 No deploy step defined; pooled-connection risk |
| Security headers | 🟠 Absent |
| Health endpoint | 🟠 Shallow — reports healthy without a database |
| Logging | 🟠 Logs all request headers (Phase 0 credential risk) |
| Error responses | ✅ Generic, no internal leakage |
| Rate limiting | 🟡 Deferred by decision (BL-007) |

---

## 🔴 Blockers — must fix before deploying

### D-001 — API build never generates the Prisma client
**Impact:** deployment fails at build, or worse, builds and crashes at runtime.

`apps/api` build is `tsc -p tsconfig.json` only. The generated Prisma client lives in `node_modules` (correctly gitignored, 0 files tracked), so it must be produced at deploy time. It is not.

**Verified:** running `prisma generate` from the repo root — where a platform's install/build hook executes — fails outright:
```
schema.prisma: file not found
prisma/schema.prisma: file not found
```
Prisma's `postinstall` hook cannot locate `apps/api/prisma/schema.prisma` in this pnpm workspace. This was visible as a warning during the very first `pnpm install` and was not acted on at the time.

**Fix:** make generation explicit in the API's own build:
```json
"build": "prisma generate && tsc -p tsconfig.json"
```

**Do not** rely on the postinstall hook — it is already proven not to work in this layout.

---

### D-002 — `CORS_ORIGINS` is undocumented
**Impact:** the deployed API silently rejects every request from the deployed frontend.

`apps/api/src/server.ts:12` reads `CORS_ORIGINS`, defaulting to `http://localhost:3000`. It appears in **no** `.env.example`. Deploying without setting it means the API allows only localhost, so the Vercel origin is refused — presenting as an opaque browser CORS error rather than a clear misconfiguration.

**Fix:** add to `apps/api/.env.example` with format documentation (comma-separated, no trailing slash), and set it on Railway to the real Vercel URL.

---

## 🟠 Should fix before deploying

### D-003 — No migration deployment step
Migrations are committed (`20260802111637_init_walking_skeleton`), but nothing runs `prisma migrate deploy`. A fresh Neon database would have **no `users` table**, so every registration returns 500.

**Fix:** run `pnpm prisma:deploy` as a Railway release/pre-deploy command — not as part of the build, so it executes once per deploy rather than per build artifact.

### D-004 — Pooled connection string used for migrations
`apps/api/.env.example` directs users to Neon's **pooled** string, and `schema.prisma` uses that single `DATABASE_URL` for both queries and migrations. Migrations issue DDL, which is unreliable through PgBouncer.

**Fix:** add `directUrl` to the datasource and document both variables:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")        // pooled — runtime queries
  directUrl = env("DIRECT_DATABASE_URL") // direct — migrations
}
```

### D-005 — No security headers; `x-powered-by` exposed
No `helmet`. Responses advertise `x-powered-by: Express` (confirmed in production-mode output).

This is **BL-006**, previously accepted on the grounds that the API had no browser-facing exposure. Deploying publicly invalidates that reasoning.

**Fix:** add `helmet` and `app.disable('x-powered-by')`.

### D-006 — Health endpoint reports healthy without a database
`/health` returns `{status:"ok"}` unconditionally. **Verified:** it returned 200 with `DATABASE_URL` entirely unset.

Railway will treat a database-less instance as healthy and route traffic to it, converting a clear startup failure into scattered 500s.

**Fix:** keep the shallow check for liveness, add a readiness check that performs `SELECT 1`.

### D-007 — All request headers are logged
`pino-http` logs complete request headers by default (visible in captured output). Harmless today — there are no auth headers — but Phase 0 introduces HTTP-only auth cookies, at which point **every request logs a session credential**.

**Fix now, while cheap:** configure redaction for `req.headers.cookie` and `req.headers.authorization`.

---

## 🟡 Accepted / deferred

| Item | Decision |
|---|---|
| **Rate limiting** (BL-007) | Deferred. Redis is already designated in `SystemDesign.md`; wire up with Authentication in Phase 0. Records a real risk: an unauthenticated public `POST /api/v1/profile` can be flooded |
| **Account enumeration** (BL-002) | Deferred to Phase 0. Now publicly reachable, so exposure increases |
| `localhost` fallbacks in `config.ts` / `server.ts` | Intentional dev-experience defaults. Both are overridden by env in production; `config.ts` already warns when unset in production |

---

## Environment Variables — complete reference

### API (Railway)

| Variable | Required | Value | Notes |
|---|---|---|---|
| `DATABASE_URL` | ✅ | Neon **pooled** string | Runtime queries |
| `DIRECT_DATABASE_URL` | ✅ (after D-004) | Neon **direct** string | Migrations only |
| `CORS_ORIGINS` | ✅ | `https://<app>.vercel.app` | **Currently undocumented — D-002.** Comma-separated, no trailing slash |
| `PORT` | ⚪ | injected by Railway | Code already honours it |
| `NODE_ENV` | ✅ | `production` | Sets log level to `info` |

### Web (Vercel)

| Variable | Required | Value | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | `https://<api>.up.railway.app` | **Inlined at build time** — changing it requires a rebuild, not a restart |

---

## Deployment Runbook

**Order matters:** the API must exist before the web app can be configured with its URL, and CORS must then be updated with the resulting Vercel URL.

### 1. Fix blockers
- [ ] D-001 — `"build": "prisma generate && tsc -p tsconfig.json"`
- [ ] D-002 — document `CORS_ORIGINS` in `.env.example`
- [ ] D-003 — Railway pre-deploy: `pnpm prisma:deploy`
- [ ] D-004 — add `directUrl`; document `DIRECT_DATABASE_URL`
- [ ] D-005 — `helmet` + disable `x-powered-by`
- [ ] D-006 — readiness check with `SELECT 1`
- [ ] D-007 — redact `cookie` / `authorization` in logs

### 2. Neon
- [ ] Confirm project region matches Railway region (cross-region adds latency to every query)
- [ ] Copy **pooled** and **direct** connection strings

### 3. Railway (API)
- [ ] Root directory: `apps/api` · Build: `pnpm build` · Start: `pnpm start`
- [ ] Pre-deploy: `pnpm prisma:deploy`
- [ ] Set all five variables above
- [ ] Verify `/health` returns 200 **and** the new readiness check passes
- [ ] Confirm `users` table exists in Neon

### 4. Vercel (Web)
- [ ] Root directory: `apps/web`
- [ ] Set `NEXT_PUBLIC_API_URL` to the Railway URL **before** first build
- [ ] Deploy, note the resulting URL

### 5. Close the loop
- [ ] Set Railway `CORS_ORIGINS` to the Vercel URL → **redeploy API**
- [ ] Register a profile from the deployed frontend
- [ ] Confirm the row exists in Neon ← **this also completes the deferred browser → Neon verification**
- [ ] Confirm duplicate submission returns 409 with friendly copy
- [ ] Confirm no secrets in deployment logs

---

## Verification Evidence

| Check | Method | Result |
|---|---|---|
| Credentials in git history | Explicit count across all commits: `npg_` / `neondb_owner` / `DATABASE_URL=<value>` | **0 / 0 / 0** ✅ |
| API production build | `rm -rf dist && tsc` | exit 0, `dist/server.js` produced ✅ |
| API starts in production mode | `NODE_ENV=production node dist/server.js` | `/health` → 200 ✅ |
| Web production build | `next build` | compiles, 5 static pages ✅ |
| Prisma generate from repo root | `npx prisma generate` | **fails — schema not found** 🔴 |
| Health without database | started with no `DATABASE_URL` | **returned 200** 🟠 |
| Node / pnpm pinned | `engines`, `packageManager` | `>=20.19.0`, `pnpm@9.15.9` ✅ |
| Migrations committed | `git ls-files` | 1 migration + lock ✅ |

**Note on methodology:** the first credential scan reported a false positive caused by a broken shell pipeline (`head` exits 0 regardless of matches, so the failure branch always fired). Re-verified with explicit match counts. This is the same pipeline mistake made earlier in the project — checks in this document assert on counts rather than exit codes.

---

## Recommendation

Fix **D-001** and **D-002** at minimum — deployment cannot succeed without them. D-003 through D-007 are each modest and materially reduce first-deploy risk; D-005 and D-007 are notably cheaper now than after Phase 0 introduces authentication.

Step 5 of the runbook satisfies the deferred **browser → Neon** verification, so deploying closes that outstanding Walking Skeleton item rather than leaving it open.
