import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly disable Turbopack to avoid build errors
  experimental: {
    turbo: undefined,
  },
  webpack: (config) => {
    return config;
  },
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
