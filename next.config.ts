import type { NextConfig } from 'next';

const productionCsp = [
  "default-src 'self'",
  // Complexity rationale: removes constant O(1) external script fetch overhead by disallowing third-party script origins.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join('; ');

const nextConfig: NextConfig = {
  async headers() {
    if (process.env.NODE_ENV !== 'production') {
      return [];
    }

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: productionCsp,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
