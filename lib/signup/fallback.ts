// lib/signup/fallback.ts
//
// TEMPORARY go-live safety net for the /business DemoForm (Web 2.1, B3).
//
// Until PAPEXWEB_SERVICE_ACCOUNT is set on Vercel, POST /api/signup answers
// 503 for every submission. So that no demo request is lost in that window,
// the DemoForm falls back to its previous client-side Firestore write
// (addDoc to `waitlist`, same payload as before) when the route is
// unconfigured/unavailable or unreachable. Nothing else triggers it: a 400
// means the input is wrong, a 429 means slow down, a 500 means the server
// tried and failed, and a filled honeypot must never write anything.
//
// Remove this file and the DemoForm fallback once the credential is live AND
// browser writes to `waitlist` are locked in the Firestore rules (after that,
// the fallback would only ever fail). See docs/SIGNUP_ROUTE.md.
//
// Pure (no Firebase import) so it can be unit-tested.

import type { SignupResult } from "./client";

const FALLBACK_ERRORS: ReadonlySet<string> = new Set(["unavailable", "not_configured", "network"]);

export function shouldFallBackToClientWrite(result: SignupResult, honeypotFilled: boolean): boolean {
  if (honeypotFilled) return false;
  if (result.ok) return false;
  return FALLBACK_ERRORS.has(result.error);
}
