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

/**
 * Demo escape hatch for a shareable preview deployment.
 *
 * A Vercel preview URL (`papexweb-git-<branch>-<scope>.vercel.app`) does not
 * start with "merchant.", so without this the entire dashboard 404s on a
 * preview — the isolation rule below working exactly as designed, against us.
 *
 * When set, the WHOLE deployment serves as the merchant dashboard: every host
 * is treated as the merchant host. That is only ever correct for a throwaway
 * preview whose sole purpose is demoing the dashboard.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * !! READ THIS BEFORE MERGING THE MERCHANT DEMO BRANCH TO main !!
 *
 * The flag IS committed, in vercel.json's `build.env`, on the
 * claude/merchant-dashboard-tunnel-setup-* branch — so that the preview
 * Vercel auto-builds from a branch push serves the dashboard without anyone
 * having to set a dashboard env var. That was a deliberate exception to this
 * file's original "never read it from a committed env file" rule, and it is
 * only survivable because of the production guard below.
 *
 * If `vercel.json` reaches main with `NEXT_PUBLIC_MERCHANT_DEMO_HOST_ANY`
 * still in `build.env`, the ONLY thing standing between papex.app and being
 * replaced by the merchant dashboard is that guard. Do not "simplify" it
 * away. Either strip the flag from vercel.json when merging, or keep the
 * guard — never neither. lib/merchantHost.test.ts asserts the guard holds;
 * if those tests start failing, that is this scenario, not a flaky test.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The guard fails CLOSED: on Vercel, demo mode requires positive proof that
 * this is not the production deployment. An unrecognised or missing
 * VERCEL_ENV disables it rather than allowing it, so a misconfigured project
 * (system env vars turned off, say) degrades to "marketing site keeps
 * working" instead of "marketing site is gone". Local dev sets no VERCEL_*
 * at all and is unaffected.
 */
function demoModeEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_MERCHANT_DEMO_HOST_ANY !== "1") return false;

  // Not on Vercel (local dev, `next start` on a box, CI): nothing to guard.
  const onVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
  if (!onVercel) return true;

  const vercelEnv = process.env.VERCEL_ENV;
  return vercelEnv === "preview" || vercelEnv === "development";
}

export function isMerchantHost(host: string): boolean {
  if (demoModeEnabled()) return true;
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
