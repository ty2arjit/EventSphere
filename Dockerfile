# Portable container image for the EventSphere API (apps/api).
#
# Works unchanged on Render, Fly.io, Railway, or any container host — nothing
# platform-specific lives here. The platform only needs to:
#   - build this Dockerfile from the REPO ROOT (not apps/api — the pnpm
#     workspace files and lockfile live at the root)
#   - route external traffic to the port the app binds ($PORT, default 4000)
#   - provide the environment variables (see apps/api/.env.example)
#
# The database is Neon (external); this image is stateless.

# ---- build stage --------------------------------------------------------
FROM node:22-slim AS build

# Prisma's engines need OpenSSL present even at build time (prisma generate).
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable

WORKDIR /app

# Whole workspace is copied (the lockfile references every package), but only
# the `api` package's dependencies are installed — this skips the entire web
# frontend dependency tree (Next.js, React, etc.) and keeps the build fast.
COPY . .
RUN pnpm install --frozen-lockfile --filter api
RUN pnpm --filter api build

# ---- runtime stage ----------------------------------------------------
FROM node:22-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=build /app /app

EXPOSE 4000

# Apply any pending migrations, then start. `migrate deploy` is the
# production-safe command (no prompts, never resets); it needs
# DIRECT_DATABASE_URL. If it fails the container exits loudly rather than
# starting against a stale schema. It is a no-op when nothing is pending, so
# running it on every boot is safe.
CMD ["sh", "-c", "pnpm --filter api prisma:deploy && pnpm --filter api start"]
