import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      { source: "/login", destination: "/dashboard", permanent: false },
    ];
  },
};

export default nextConfig;
