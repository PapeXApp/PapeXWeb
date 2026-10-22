import type { NextConfig } from "next";
import { CREDENTIAL_PATH_PREFIXES } from "./lib/analyticsGate";

// Receipt / invite / merchant URLs are credentials (lib/analyticsGate.ts), so
// nothing on those pages may hand the URL on in a Referer header or
// document.referrer: a same-origin click out of /r?rid=… would otherwise reach
// the next page's analytics as its referrer. `no-referrer` rather than the
// default, because the default still sends the FULL url to same-origin targets.
// One rule per prefix (`/r` and `/r/…`), plus the merchant subdomain, whose
// visible paths (/, /tx/<sid>) are rewritten to /merchant/* after this match.
const NO_REFERRER = [{ key: "Referrer-Policy", value: "no-referrer" }];
const credentialRouteHeaders = [
  ...CREDENTIAL_PATH_PREFIXES.flatMap((prefix) => [
    { source: prefix, headers: NO_REFERRER },
    { source: `${prefix}/:path*`, headers: NO_REFERRER },
  ]),
  { source: "/:path*", has: [{ type: "host" as const, value: "merchant\\..*" }], headers: NO_REFERRER },
];

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
      // Straight to /business, not to /pos-calculator: chaining through it
      // would add a second hop now that /pos-calculator itself redirects
      // (this used to be a page.tsx `redirect("/pos-calculator?tab=full")`,
      // now removed).
      { source: '/pos-value-prop', destination: '/business', permanent: false },
      { source: '/waitlist', destination: '/', permanent: false },
      { source: '/survey', destination: '/', permanent: false },
      { source: '/contact', destination: '/about', permanent: false },
    ];
  },
  async headers() {
    return [
      ...credentialRouteHeaders,
      // Android App Links (assetlinks.json) and iOS Universal Links (AASA) are
      // DIFFERENT mechanisms that happen to share the /.well-known/ prefix.
      // Android needs this file to name com.app.papex plus the SHA-256 of the
      // signing cert; the paths it applies to are declared in the APP’s intent
      // filters, not here — the mirror image of the AASA below, which declares
      // the paths server-side and names only the team + bundle id.
      //
      // Content-Type is set explicitly for the same reason as the AASA: Google’s
      // verifier requires application/json and follows no redirects. Next already
      // infers it from the .json extension, so this is belt-and-braces plus a
      // place to hang the explanation. middleware.ts’s matcher excludes
      // /.well-known/ so nothing rewrites it.
      {
        source: '/.well-known/assetlinks.json',
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
