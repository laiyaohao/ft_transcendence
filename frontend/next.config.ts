import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  poweredByHeader: false,
  turbopack: {
    root: process.cwd()
  },
  // devIndicators: false, // Disables the indicator badge entirely
};

export default nextConfig;
