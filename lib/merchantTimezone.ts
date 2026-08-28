// lib/merchantTimezone.ts
//
// Split out of lib/merchantApi.ts into its own module specifically to avoid
// a circular import: merchantApi.ts imports `* as mock from
// "./merchantMock"` (for the MERCHANT_MOCK-gated code paths), and
// merchantMock.ts needs this same constant. Having merchantMock.ts import
// it FROM merchantApi.ts created a cycle that crashed at runtime —
// "Cannot access 'MERCHANT_DISPLAY_TIMEZONE' before initialization" — even
// though `tsc --noEmit` and `next lint` both passed clean (neither checks
// module-evaluation order). Both files now import from here instead, so
// there is no cycle.

/**
 * Interim, pilot-wide display timezone — decided 2026-08-12: every pilot
 * merchant is US-based, so America/Los_Angeles is closer to right than UTC
 * for all of them, but it is still wrong for any merchant not actually on
 * the Pacific coast. The Lambda's `MERCHANT_TIMEZONE` (Papex_RDH/lambdas/
 * merchant-api/handler.js) is the actual source of truth for what
 * `MerchantInsights.timezone` / the `hour`/`dow` filter buckets mean — this
 * constant exists so the CLIENT (which doesn't get to read the server's
 * constant) has one place to keep its own copy in sync, for chart labels
 * and for formatting the transactions list's timestamps in the SAME zone
 * the hour/dow filters bucket in. Remove once a real per-merchant timezone
 * exists and every response carries its own.
 */
export const MERCHANT_DISPLAY_TIMEZONE = "America/Los_Angeles";
