import type { NextConfig } from 'next';

const API_UPSTREAM_URL = (
  process.env.API_UPSTREAM_URL || 'https://horvath-production.up.railway.app'
).replace(/\/+$/, '');

const nextConfig: NextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_UPSTREAM_URL}/api/:path*`,
      },
    ];
  },
  async headers() {
    if (process.env.NODE_ENV !== 'production') {
      return [];
    }

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default nextConfig;
