// lib/cards/grant.ts
//
// Cards grants on the web (1.7.1, PapeX #27). Pure; no Next imports.
//
// WHY. The RDH cards service used to answer on the sid alone. A sid leaks (a
// 1.6.x copy-link share was `?rid=rdh_<sid>`), and `/r?sid=` then showed any
// link-holder the merchant's offer and its per-sid code. The service now
// serves a live surface only inside the receipt's 30-minute TAP WINDOW, or to
// a request carrying a grant. Inside the window it returns a TAP grant in the
// `x-papex-cards-grant` response header (Papex_RDH_Backend
// lambdas/cards/lib/grant.js):
//
//   g1.t.<exp unix s>.<43 base64url MAC>   expires at upload + 24 h
//
// This page keeps it in an httpOnly cookie scoped to /r (one per sid, set by
// app/api/r/[sid]/cards-grant) and sends it back on later renders, so the
// person who TAPPED can come back to their offer for a day. Anyone else who
// only has the sid (a forwarded link) has no cookie and gets no offers once
// the window has closed. The web cannot verify a grant (no secret here); the
// service is the authority, this file only checks the shape.

export const CARDS_GRANT_HEADER = "x-papex-cards-grant";

/** Any grant (owner or tap), shape only. */
export const CARDS_GRANT_RE = /^g1\.[to]\.[1-9]\d{8,10}\.[A-Za-z0-9_-]{43}$/;
/** A tap grant: the only kind the web ever stores. */
export const TAP_GRANT_RE = /^g1\.t\.[1-9]\d{8,10}\.[A-Za-z0-9_-]{43}$/;

/** A tap grant never lives longer than this in the cookie, whatever it claims. */
export const MAX_GRANT_COOKIE_S = 48 * 60 * 60;

export function isCardsGrant(value: unknown): value is string {
  return typeof value === "string" && CARDS_GRANT_RE.test(value);
}

export function isTapGrant(value: unknown): value is string {
  return typeof value === "string" && TAP_GRANT_RE.test(value);
}

/** `pxcg_<sid>`: one cookie per receipt. */
export function grantCookieName(sid: string): string {
  return `pxcg_${sid}`;
}

/** The stored tap grant for `sid` from a raw Cookie header, or undefined. */
export function readGrantCookie(cookieHeader: string | null | undefined, sid: string): string | undefined {
  if (!cookieHeader) return undefined;
  const name = grantCookieName(sid);
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    const value = part.slice(eq + 1).trim();
    return isTapGrant(value) ? value : undefined;
  }
  return undefined;
}

/** Seconds until the grant expires (capped), or 0 when it has / is malformed. */
export function grantCookieMaxAge(grant: string, nowMs: number): number {
  if (!isTapGrant(grant)) return 0;
  const exp = Number(grant.split(".")[2]);
  const left = Math.floor(exp - nowMs / 1000);
  return left > 0 ? Math.min(left, MAX_GRANT_COOKIE_S) : 0;
}

/** The Set-Cookie value for a tap grant, or null when it cannot be stored. */
export function grantSetCookie(sid: string, grant: string, nowMs: number): string | null {
  const maxAge = grantCookieMaxAge(grant, nowMs);
  if (maxAge <= 0) return null;
  return `${grantCookieName(sid)}=${grant}; Path=/r; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

/** A cross-site POST to the cookie route is refused (the page itself is same-origin). */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // a same-origin fetch from an older engine may omit it
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}
