// lib/merchantHost.ts
//
// Pure host/path routing logic for the merchant.papex.app subdomain, split
// out of middleware.ts so it's unit-testable without spinning up the Next.js
// middleware runtime (see lib/merchantHost.test.ts, run via `npm run
// test:merchantHost`, same tsx-script pattern as lib/escpos.test.ts).
//
// Rule (per docs/rdh_orchestrator.md's AASA scar tissue — a Vercel *redirect*
// once silently broke Apple's AASA fetch — this project rewrites, never
// redirects, for host-based routing):
//   - host starts with "merchant."   -> rewrite /<path> to /merchant/<path>
//   - any other host requesting /merchant/* -> rewrite to a 404 (this repo's
//     conventional not-found path so app/not-found.jsx renders); merchant
//     dashboard internals must not be reachable at papex.app/merchant/... by
//     a stray link or a merchant pasting the wrong URL.
//   - everything else (main site on papex.app, /r, /rdh, /api, /_next,
//     /.well-known, static assets) is untouched — middleware.ts's `matcher`
//     is the first line of defense (those paths never reach this function at
//     all), this function is a second, defensive no-op for anything that
//     isn't the merchant host rewriting a non-/merchant path.

export type MerchantRouteDecision =
  | { action: "rewrite"; pathname: string }
  | { action: "none" };

/** Strip a port suffix ("merchant.papex.app:3000" in local dev) before matching. */
function hostnameOnly(host: string): string {
  return host.split(":")[0]?.toLowerCase() ?? "";
}

export function isMerchantHost(host: string): boolean {
  return hostnameOnly(host).startsWith("merchant.");
}

/**
 * Decide the rewrite for a single request. `pathname` is the incoming
 * request path (always starts with "/"); `host` is the raw Host header
 * (may include a port).
 */
export function resolveMerchantRewrite(host: string, pathname: string): MerchantRouteDecision {
  if (isMerchantHost(host)) {
    // Avoid double-prefixing if something upstream already sent /merchant/*.
    if (pathname === "/merchant" || pathname.startsWith("/merchant/")) {
      return { action: "none" };
    }
    const suffix = pathname === "/" ? "" : pathname;
    return { action: "rewrite", pathname: `/merchant${suffix}` };
  }

  // Non-merchant host reaching for /merchant/* directly: hide it behind the
  // site's standard 404 rather than exposing the dashboard route tree. This
  // rewrites to a path that deliberately matches no route so Next's App
  // Router falls back to app/not-found.jsx (a literal "/404" URL isn't a
  // real route in the App Router, so that wouldn't trigger the 404 boundary
  // — an unmatched path is what does).
  if (pathname === "/merchant" || pathname.startsWith("/merchant/")) {
    return { action: "rewrite", pathname: "/__merchant_not_found__" };
  }

  return { action: "none" };
}
