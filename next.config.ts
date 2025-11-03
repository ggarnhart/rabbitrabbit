import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    return config;
  },
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
