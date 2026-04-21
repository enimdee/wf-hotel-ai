import type { NextConfig } from "next";
import path from "node:path";

const config: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  // Pin the workspace root so Next.js does not walk up the tree and pick
  // a stray package-lock.json from the user's home directory.
  outputFileTracingRoot: path.resolve(__dirname),
  experimental: {
    typedRoutes: true,
  },
};

export default config;
