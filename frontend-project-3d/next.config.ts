import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "curious-tapir-476.convex.cloud",
      },
    ],
  },
};

export default nextConfig;
