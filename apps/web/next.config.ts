import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    /**
     * Pin the workspace root explicitly.
     *
     * Without this, Next.js walks up the directory tree looking for lockfiles
     * and selected `~/package-lock.json` — a stray file outside this project —
     * as the root. That mis-scopes module resolution and file tracing, which
     * typically surfaces as missing-file errors at deploy time rather than
     * locally.
     *
     * `turbopack` is a top-level option in Next.js 16 (it moved out of
     * `experimental`).
     */
    root: path.join(__dirname, "..", ".."),
  },
};

export default nextConfig;
