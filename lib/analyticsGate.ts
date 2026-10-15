// lib/analyticsGate.ts
//
// Google Analytics (gtag.js) for papex.app, with a gate in front of it.
//
// WHY. On a receipt link the URL IS the credential: `/r?rid=…` (peer-to-peer
// share), `/r?sid=…` and `/w?sid=…` (RDH tap), `/rdh?sid=…`, `/invite/<token>`,
// `/merchant/tx/<sid>`. Anyone holding the URL can open the receipt. GA's
// default hit carries `page_location` (the full URL) and `page_referrer`, so a
// site-wide gtag snippet hands every one of those to Google. (Issue #53.)
//
// WHAT. GA is simply never started in a document that touched a credential
// URL, as its location or as its referrer. No gtag.js, no dataLayer, no hit:
// there is nothing to strip, so there is no sanitiser to get wrong. The check
// is made on the real `window.location` in the browser, not on Next's router
// state, so it holds for rewritten hosts (merchant.papex.app serves /merchant/*
// under a clean-looking `/…`) and for any way a URL reaches the page.
//
// The gate is STICKY. Once a document has been on a credential URL (hard load,
// or a client-side navigation into one) GA is switched off for the rest of
// that document's life:
//   - `window['ga-disable-<id>'] = true` is gtag.js's own kill switch. It is
//     checked when gtag.js is about to send, so it also silences the automatic
//     history-change page_view / enhanced-measurement hits of a gtag.js that
//     was already running.
//   - It is never switched back on, because gtag.js remembers the previous
//     location it saw and uses it as the next page_view's `page_referrer`; a
//     page_view that follows a credential URL could carry that URL.
// A fresh document (hard navigation) gets a clean decision, and the receipt
// pages send `Referrer-Policy: no-referrer` (next.config.ts) so that fresh
// document's `document.referrer` is empty rather than the receipt URL.
//
// FAIL CLOSED. The list below is a deny-list of route prefixes, plus a deny-list
// of credential-looking query/hash parameter names that applies on every page.
// lib/analyticsGate.test.ts fails when a new top-level route under app/ has not
// been classified, so a new credential route cannot ship quietly.

import { isMerchantHost } from "./merchantHost";

/**
 * Route prefixes whose URLs carry (or may carry) a credential, in the path or
 * the query. A prefix matches itself and everything below it.
 *   /r        receipt page: ?sid= (RDH tap), ?rid= (share link); /r/demo too
 *   /w        /r without the App Clip (RDH unit 003): ?sid=
 *   /rdh      "Save to PapeX" hand-off: ?sid=
 *   /demo     /demo/r?sid= (the /r/demo fallback)
 *   /invite   /invite/<token>
 *   /merchant the merchant dashboard: /merchant/tx/<sid>, plus merchant and
 *             request ids in the query. (merchant.papex.app is covered by host.)
 * next.config.ts reads this list to attach the Referrer-Policy header.
 */
export const CREDENTIAL_PATH_PREFIXES = ["/r", "/w", "/rdh", "/demo", "/invite", "/merchant"] as const;

/** Query/hash parameter names that are credentials wherever they appear. Lower case. */
export const CREDENTIAL_PARAMS: readonly string[] = [
  "sid",
  "rid",
  "token",
  "access_token",
  "id_token",
  "refresh_token",
  "invite",
  "code",
  "secret",
];

/** The slice of `Location` / `URL` the gate reads. */
export interface LocationLike {
  host?: string;
  pathname: string;
  search?: string;
  hash?: string;
}

/** Lower-cased, decoded, slash-collapsed path with no trailing slash. null = undecodable. */
function normalizePath(pathname: string): string | null {
  let path: string;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  path = path.toLowerCase().replace(/\/{2,}/g, "/");
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

function hasCredentialParam(raw: string): boolean {
  if (!raw) return false;
  for (const name of new URLSearchParams(raw).keys()) {
    if (CREDENTIAL_PARAMS.includes(name.toLowerCase())) return true;
  }
  return false;
}

/** True when this location is, or may carry, a receipt/invite/merchant credential. */
export function isCredentialLocation(loc: LocationLike): boolean {
  if (loc.host && isMerchantHost(loc.host)) return true;
  const path = normalizePath(loc.pathname);
  if (path === null) return true; // undecodable path: fail closed
  if (CREDENTIAL_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return true;
  const search = (loc.search ?? "").replace(/^\?/, "");
  // `#rid=…` and `#/anything?rid=…` both count.
  const hash = (loc.hash ?? "").replace(/^#/, "").replace(/^[^?=]*\?/, "");
  return hasCredentialParam(search) || hasCredentialParam(hash);
}

/** papex.app and its subdomains (links., merchant., www.), or the host serving this page. */
function isOwnHost(hostname: string, selfHostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === selfHostname.toLowerCase() || h === "papex.app" || h.endsWith(".papex.app");
}

/**
 * True when `document.referrer` is one of our own credential URLs. A referrer
 * from another site is never judged on its path (reddit.com/r/… is not ours);
 * an unparsable referrer fails closed.
 */
export function isCredentialReferrer(referrer: string, self: { hostname: string }): boolean {
  if (!referrer) return false;
  let url: URL;
  try {
    url = new URL(referrer);
  } catch {
    return true;
  }
  if (isMerchantHost(url.host)) return true;
  return isOwnHost(url.hostname, self.hostname) && isCredentialLocation(url);
}

// ---- the browser side ---------------------------------------------------------
//
// Structural types, so the real `window`/`document` and the fakes in
// lib/analyticsGate.test.ts both fit (cast once at the call site).

export interface GaWindow {
  location: { host: string; hostname: string; pathname: string; search: string; hash: string; href: string };
  history: {
    pushState(data: unknown, unused: string, url?: string | URL | null): void;
    replaceState(data: unknown, unused: string, url?: string | URL | null): void;
  };
  addEventListener(type: "popstate", listener: () => void): void;
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  // `ga-disable-<id>` and the two idempotency markers below.
  [key: string]: unknown;
}

export interface GaDocument {
  referrer: string;
  head: { appendChild(node: unknown): unknown };
  createElement(tag: "script"): { async: boolean; src: string };
}

export const GTAG_SRC = "https://www.googletagmanager.com/gtag/js";

/** gtag.js's own kill switch for one measurement id. */
export const disableFlag = (measurementId: string) => `ga-disable-${measurementId}`;

const GUARDED = "__papexGaHistoryGuard";
const STARTED = "__papexGaStarted";

/**
 * Switch GA off for the rest of this document when history is about to move to,
 * or has moved to, a credential URL. Wraps pushState/replaceState so the flag is
 * set BEFORE the URL changes (gtag.js sends its history-change page_view right
 * after the change), and listens to popstate for back/forward.
 */
function guardHistory(win: GaWindow, measurementId: string): void {
  if (win[GUARDED]) return;
  win[GUARDED] = true;
  const flag = disableFlag(measurementId);

  const check = (url: string | URL | null | undefined) => {
    if (url == null) return;
    try {
      if (isCredentialLocation(new URL(String(url), win.location.href))) win[flag] = true;
    } catch {
      win[flag] = true; // unparsable target: fail closed
    }
  };

  for (const method of ["pushState", "replaceState"] as const) {
    const original = win.history[method];
    win.history[method] = function (this: unknown, ...args: [unknown, string, (string | URL | null)?]) {
      check(args[2]);
      return original.apply(this, args);
    };
  }
  win.addEventListener("popstate", () => {
    if (isCredentialLocation(win.location)) win[flag] = true;
  });
}

/**
 * Start Google Analytics in this document unless it has touched a credential
 * URL. Idempotent (React strict mode and HMR run effects twice).
 * Returns "loaded" or "blocked".
 */
export function startGoogleAnalytics(win: GaWindow, doc: GaDocument, measurementId: string): "loaded" | "blocked" {
  const flag = disableFlag(measurementId);
  guardHistory(win, measurementId);

  if (win[flag] === true || isCredentialLocation(win.location) || isCredentialReferrer(doc.referrer, win.location)) {
    win[flag] = true; // sticky; also stops any gtag.js that is somehow already here
    return "blocked";
  }
  if (win[STARTED]) return "loaded";
  win[STARTED] = true;

  // Google's snippet, verbatim in effect: gtag.js needs the `arguments` object
  // itself in the dataLayer, not an array.
  const dataLayer: unknown[] = (win.dataLayer = win.dataLayer || []);
  win.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    dataLayer.push(arguments);
  };
  win.gtag("js", new Date());
  win.gtag("config", measurementId);

  const script = doc.createElement("script");
  script.async = true;
  script.src = `${GTAG_SRC}?id=${encodeURIComponent(measurementId)}`;
  doc.head.appendChild(script);
  return "loaded";
}
