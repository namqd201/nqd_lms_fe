import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(self "https://small-forest-267978.app.100ms.live"), microphone=(self "https://small-forest-267978.app.100ms.live"), geolocation=(), browsing-topics=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Access-Control-Allow-Origin',
    value: 'https://nqdlms.online',
  },
  {
    key: 'Access-Control-Allow-Methods',
    value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  },
  {
    key: 'Access-Control-Allow-Headers',
    value: 'Content-Type, Authorization, X-Requested-With',
  },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, max-age=0, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/(favicon.ico|manifest.json|icon.png|logo.png|logo.jpg)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
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

