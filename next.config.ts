import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://nqd-lms-be.onrender.com/api/:path*',
      },
    ];
  },
};

export default nextConfig;
