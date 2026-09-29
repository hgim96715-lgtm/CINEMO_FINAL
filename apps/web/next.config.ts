import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@cinemo/shared', '@cinemo/api-contract'],
};

export default nextConfig;
