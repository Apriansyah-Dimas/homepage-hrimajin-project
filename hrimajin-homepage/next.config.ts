import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Turbopack builds from this project folder (avoid picking parent lockfile)
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
