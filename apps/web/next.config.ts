import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@cinemo/shared", "@cinemo/api-contract"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "file.koreafilm.or.kr",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.forbeskorea.co.kr",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
