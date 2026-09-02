import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @electric-sql/pglite ships a WASM binary + on-disk data files it loads at runtime; bundling it
  // into the server chunk (Next's default) instead of a real require() from node_modules breaks
  // that resolution on serverless targets. It's also only ever imported when DATABASE_URL is unset
  // (local dev), so this has no effect on a production deployment that sets DATABASE_URL. See
  // DECISIONS.md.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
