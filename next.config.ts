import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: true,
    unoptimized: false,
  },
  eslint: {
    // Don't run ESLint during build, we'll handle it separately
    ignoreDuringBuilds: true,
  },
  // Remove trailing slash to prevent routing issues
  trailingSlash: false,
  // Marketing decisions (Nico, 2026-09-24), not moves: temporary (307) so the
  // routes can come back. Never add a rule here that matches /r, /rdh,
  // /.well-known, /api, /merchant* or /_next (a redirect once broke Apple's
  // AASA fetch; merchant routing is rewrite-only, in middleware.ts).
  async redirects() {
    return [
      { source: '/pos-calculator', destination: '/business', permanent: false },
      { source: '/waitlist', destination: '/', permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: '/.well-known/apple-app-site-association',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=300',
          },
        ],
      },
      {
        source: '/apple-app-site-association',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=300',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
