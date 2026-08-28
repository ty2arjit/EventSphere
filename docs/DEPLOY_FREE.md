# Deploying the API on a free host (no credit card)

Railway's free trial ends and then requires a paid plan. Only the **API** and
**Redis** were on Railway — this guide moves them off. Nothing else changes:

| Piece            | Where it lives            | Action |
|------------------|---------------------------|--------|
| Postgres         | Neon (free)               | none — keep as is |
| Web frontend     | Vercel (free)             | one env var change (new API URL) |
| **API**          | Railway → **Koyeb**       | redeploy from the `Dockerfile` |
| **Redis**        | Railway → **Upstash** (free) | new `REDIS_URL` |
| Image uploads    | Cloudinary (free)         | none |

The repo now has a portable `Dockerfile` at the root, so the API can run on
Koyeb, Render, Fly.io, or back on Railway with no code changes.

---

## 1. Redis → Upstash (2 min)

1. Sign up at upstash.com (GitHub login, no card).
2. Create a Redis database (any region near your Neon region).
3. Copy the **`rediss://…` connection URL** (the TLS one).
4. You'll paste it as `REDIS_URL` on the API host below.

> The app treats Redis as optional — if you skip this entirely it still runs,
> just without permission/metrics caching. Fine at demo scale.

## 2. API → Koyeb (primary choice — no cold starts, no card)

1. Sign up at koyeb.com with GitHub (no card for the free instance).
2. **Create Web Service → GitHub → select the `EventSphere` repo**, branch `master`.
3. Builder: **Dockerfile** (it auto-detects the root `Dockerfile`).
4. Instance: **Free**.
5. Port: **4000**, health check path **`/ready`**.
6. Add environment variables (from `apps/api/.env.example`):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Neon **pooled** connection string |
   | `DIRECT_DATABASE_URL` | Neon **direct** string (pooled host minus `-pooler`) |
   | `JWT_ACCESS_SECRET` | same secret you used on Railway (keep it — rotating logs everyone out) |
   | `CORS_ORIGINS` | your Vercel URL, e.g. `https://event-sphere-web.vercel.app` |
   | `WEB_BASE_URL` | same Vercel URL |
   | `COOKIE_SECURE` | `true` |
   | `NODE_ENV` | `production` |
   | `REDIS_URL` | the Upstash `rediss://…` URL |
   | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | as before (optional) |
   | `CLOUDINARY_URL` | as before (optional) |
   | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | as before |

7. Deploy. First boot runs `prisma migrate deploy` automatically (that's why
   `DIRECT_DATABASE_URL` must be set), then starts the server.
8. Note the public URL, e.g. `https://eventsphere-xxxx.koyeb.app`.

## 3. Point the frontend at the new API

On **Vercel → EventSphere web project → Settings → Environment Variables**:

- `NEXT_PUBLIC_API_URL` = the new Koyeb URL (no trailing slash)

Redeploy the Vercel project (Deployments → ⋯ → Redeploy).

## 4. Update the Razorpay webhook

Razorpay dashboard → Settings → Webhooks → edit the endpoint URL to
`https://eventsphere-xxxx.koyeb.app/api/v1/payments/webhook`.

## 5. Smoke test

```
curl https://eventsphere-xxxx.koyeb.app/ready      # {"status":"ok","database":"reachable"}
```
Then load the Vercel site, sign in, open an event.

---

## Fallback: Render (if Koyeb's free tier has changed)

Render's free web service works the same way (New → Web Service → repo →
Docker → free plan → same env vars). The catch: it **sleeps after 15 min of
inactivity** and the next request takes ~50s to wake — bad if an interviewer
opens a cold link.

Mitigation: create a free monitor at **cron-job.org** or **UptimeRobot** that
GETs `https://<your-app>.onrender.com/health` every 10 minutes. That keeps it
warm within the 750 free hours/month (a single always-on service uses ~744).
