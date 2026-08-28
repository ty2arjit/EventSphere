# Deploying the API on a free host

Railway's free trial ends and then requires a paid plan. Only the **API** and
**Redis** were on Railway — this guide moves them off. Nothing else changes:

| Piece            | Where it lives            | Action |
|------------------|---------------------------|--------|
| Postgres         | Neon (free)               | none — keep as is |
| Web frontend     | Vercel (free)             | one env var change (new API URL) |
| **API**          | Railway → **Render**      | deploy the root `Dockerfile` |
| **Redis**        | Railway → **Upstash** (free) | new `REDIS_URL` (or drop it) |
| Image uploads    | Cloudinary (free)         | none |

> Koyeb (the earlier suggestion) was acquired by Mistral AI in Feb 2026 and
> closed its free tier to new users — it's no longer an option.

The repo has a portable `Dockerfile` at the root, so the API also runs on
Fly.io or back on Railway with no code changes.

---

## 1. Redis → Upstash (optional, 2 min)

1. Sign up at upstash.com (GitHub login).
2. Create a Redis database near your Neon region.
3. Copy the **`rediss://…` (TLS) connection URL** → you'll set it as `REDIS_URL`.

The app treats Redis as optional — skip this entirely and it still runs, just
without permission/metrics caching. Fine at demo scale.

## 2. API → Render

Render → **New → Web Service → Build and deploy from a Git repository** → pick
`EventSphere`. Then:

| Setting | Value |
|---|---|
| Name | `eventsphere-api` (→ `https://eventsphere-api.onrender.com`) |
| Language | **Docker** |
| Branch | `master` |
| Root Directory | **leave blank** (the Dockerfile is at the repo root and needs the whole workspace) |
| Dockerfile Path | `./Dockerfile` (default) |
| Region | same as your Neon database |
| Instance Type | **Free** |
| Health Check Path | `/health` |

**Environment variables** (Advanced → Add from `.env` or one by one):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon **pooled** connection string |
| `DIRECT_DATABASE_URL` | Neon **direct** string (pooled host minus `-pooler`) |
| `JWT_ACCESS_SECRET` | the **same** value you used on Railway (changing it logs everyone out) |
| `CORS_ORIGINS` | your Vercel URL, e.g. `https://event-sphere-web.vercel.app` — no trailing slash |
| `WEB_BASE_URL` | same Vercel URL |
| `NODE_ENV` | `production` |
| `COOKIE_SECURE` | `true` |
| `REDIS_URL` | the Upstash `rediss://…` URL (omit if you skipped step 1) |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | as before (optional) |
| `CLOUDINARY_URL` | as before (optional) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | once the payment feature is merged |

Do **not** set `PORT` — Render injects its own and the app reads it.

Deploy. First boot runs `prisma migrate deploy` automatically (needs
`DIRECT_DATABASE_URL`), then starts the server. Watch the logs for
`API listening`.

## 3. Point the frontend at the new API

Vercel → EventSphere web project → Settings → Environment Variables:

- `NEXT_PUBLIC_API_URL` = the Render URL (no trailing slash)

Redeploy the Vercel project (Deployments → ⋯ → Redeploy).

## 4. Keep it awake

Render's free instance sleeps after 15 min idle; the next request takes ~50s.
Create a free monitor at **cron-job.org** or **uptimerobot.com** that GETs
`https://eventsphere-api.onrender.com/health` every 10 minutes. A single
always-on service stays within Render's 750 free instance-hours/month.

## 5. Update the Razorpay webhook (if payments are merged)

Razorpay dashboard → Settings → Webhooks → set the endpoint URL to
`https://eventsphere-api.onrender.com/api/v1/payments/webhook`.

## 6. Smoke test

```
curl https://eventsphere-api.onrender.com/ready
# {"status":"ok","database":"reachable"}
```
Then load the Vercel site, sign in, open an event.
