import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      new URL('https://dev-dhana-id.creatorcenter.id/**'),
      new URL('https://placehold.co/**')
    ],
  },
};

export default nextConfig;
