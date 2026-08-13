// lib/deployEnv.ts
//
// One question, asked from two very different places: "is it safe to let a
// demo override change how this deployment behaves?"
//
// Two flags can do that, and both are committed in vercel.json's `build.env`
// on the merchant demo branch so Vercel's auto-preview is a working demo:
//
//   NEXT_PUBLIC_MERCHANT_DEMO_HOST_ANY=1  every host serves the merchant
//                                         dashboard (lib/merchantHost.ts)
//   NEXT_PUBLIC_MERCHANT_MOCK=1           the dashboard serves synthetic data
//                                         instead of the real API
//                                         (lib/merchantApi.ts)
//
// On a production deployment the first replaces papex.app with the merchant
// dashboard, and the second shows a real merchant invented transactions they
// might act on. Neither may EVER be live on production, whatever any env file
// or build config says — hence this gate, which both flags pass through.
//
// It fails CLOSED: an override is allowed only on positive proof that this is
// not a production Vercel deployment. Ambiguity costs the demo, never the
// production site.
//
// Two env vars, because this is read from both runtimes: edge middleware sees
// VERCEL_ENV, the browser bundle only sees NEXT_PUBLIC_-prefixed vars, and
// Vercel exposes NEXT_PUBLIC_VERCEL_ENV for exactly that reason. Checking both
// means one implementation serves server, edge, and client callers.

/** The environment Vercel reports, from whichever var is visible in this runtime. */
function vercelEnv(): string | undefined {
  return process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV || undefined;
}

/** True when this build/request is running on Vercel at all. */
function onVercel(): boolean {
  return process.env.VERCEL === "1" || vercelEnv() !== undefined;
}

/**
 * May demo overrides take effect here?
 *
 * - Local dev, `next start` on a box, CI: yes — nothing to protect.
 * - Vercel preview or development deployment: yes — that is the point.
 * - Vercel production: no.
 * - On Vercel but the environment can't be determined (system env vars turned
 *   off, or a future Vercel change): no. Refusing costs a demo; allowing could
 *   cost the marketing site.
 */
export function demoOverridesAllowed(): boolean {
  if (!onVercel()) return true;
  const env = vercelEnv();
  return env === "preview" || env === "development";
}
