# Portable container image for the EventSphere API (apps/api).
#
# Works unchanged on Koyeb, Render, Fly.io, Railway, or any container host —
# nothing platform-specific lives here. The platform only needs to:
#   - build this Dockerfile
#   - expose the port from $PORT (defaults to 4000)
#   - provide the environment variables (see apps/api/.env.example)
#
# The database is Neon (external); this image is stateless.

# ---- build stage ----------------------------------------------------------
FROM node:22-slim AS build

# Prisma's engines need OpenSSL present even at build time (prisma generate).
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable

WORKDIR /app

# Copy the whole workspace and do one clean, lockfile-pinned install. For a
# repo this size a full install is simpler and less fragile than trying to
# prune the pnpm workspace graph by hand.
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter api build

# ---- runtime stage -------------------------------------------------------
FROM node:22-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Bring over the fully installed + built workspace.
COPY --from=build /app /app

EXPOSE 4000

# Apply any pending migrations, then start. `migrate deploy` is the
# production-safe command (no prompts, never resets); it needs
# DIRECT_DATABASE_URL. If it fails the container exits loudly rather than
# starting against a stale schema.
CMD ["sh", "-c", "pnpm --filter api prisma:deploy && pnpm --filter api start"]
