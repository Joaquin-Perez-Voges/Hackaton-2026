import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this app (the monorepo has another lockfile above).
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
