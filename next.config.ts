import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 ships a native .node binary — bundling it into the server chunk (Next's
  // default) instead of leaving it as a real require() from node_modules breaks on serverless
  // targets like Vercel. See DECISIONS.md.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
