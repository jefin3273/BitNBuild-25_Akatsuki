import type { NextConfig } from "next";
// const withPWA = require("next-pwa");

const nextConfig: NextConfig = {
  /* config options here */
  pwa: {
    dest: "public",
    disable: process.env.NODE_ENV === "development", // Disable in dev
  },
  images: {
    remotePatterns: [
      {
        hostname: "ik.imagekit.io",
      },
      {
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
