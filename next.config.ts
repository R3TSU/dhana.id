import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dev-dhana-id.creatorcenter.id",
        pathname: "/**", // allows all paths
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**", // allows all paths (e.g., /600x200/slate/white?text=No+Image)
      },
    ],
  },
};

export default nextConfig;
