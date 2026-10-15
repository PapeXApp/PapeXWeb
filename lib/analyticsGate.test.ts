// lib/analyticsGate.test.ts
//
// Standalone test script (no test framework in this repo — see package.json).
// Run with:
//   npm run test:analyticsGate
//
// Issue #53: Google Analytics must never receive a receipt credential. The
// credential is the URL itself (`/r?rid=…`, `/r?sid=…`, `/w?sid=…`, `/rdh?sid=…`,
// `/invite/<token>`, `/merchant/tx/<sid>`), and GA's default hit carries
// `page_location` and `page_referrer`. The module under test starts GA from the
// browser or not at all; these tests run it against a fake window/document and
// check three things: GA is absent on every credential URL, GA is present on
// ordinary pages, and no credential value ever reaches a gtag call, the
// dataLayer or the gtag.js URL.

import assert from "node:assert/strict";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  CREDENTIAL_PARAMS,
  CREDENTIAL_PATH_PREFIXES,
  GTAG_SRC,
  disableFlag,
  isCredentialLocation,
  isCredentialReferrer,
  startGoogleAnalytics,
  type GaDocument,
  type GaWindow,
} from "./analyticsGate";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log(`  ok - ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL - ${name}`);
    console.error(err instanceof Error ? err.message : err);
  }
}

const ID = "G-TEST123456";
const FLAG = disableFlag(ID);
const SECRET = "SECRETvalue0123456789";

const loc = (href: string) => {
  const u = new URL(href);
  return { host: u.host, pathname: u.pathname, search: u.search, hash: u.hash };
};

// ---- a fake browser ---------------------------------------------------------

type Script = { async: boolean; src: string };

function fakeBrowser(href: string, referrer = "") {
  const scripts: Script[] = [];
  const listeners: Array<() => void> = [];
  /** What the (fake) native pushState/replaceState saw, and the flag's value at that moment. */
  const nativeCalls: Array<{ method: string; url: unknown; flagAtCall: unknown; self: unknown }> = [];

  const win = {
    location: { host: "", hostname: "", pathname: "", search: "", hash: "", href: "" },
    history: {} as GaWindow["history"],
    addEventListener(_type: "popstate", listener: () => void) {
      listeners.push(listener);
    },
  } as unknown as GaWindow;

  function setLocation(next: string) {
    const u = new URL(next, win.location.href || undefined);
    Object.assign(win.location, {
      host: u.host,
      hostname: u.hostname,
      pathname: u.pathname,
      search: u.search,
      hash: u.hash,
      href: u.href,
    });
  }
  setLocation(href);

  for (const method of ["pushState", "replaceState"] as const) {
    win.history[method] = function (this: unknown, _data: unknown, _unused: string, url?: string | URL | null) {
      nativeCalls.push({ method, url, flagAtCall: win[FLAG], self: this });
      if (url != null) setLocation(String(url));
    };
  }

  const doc: GaDocument = {
    referrer,
    head: {
      appendChild(node: unknown) {
        scripts.push(node as Script);
        return node;
      },
    },
    createElement: () => ({ async: false, src: "" }),
  };

  return {
    win,
    doc,
    scripts,
    nativeCalls,
    setLocation,
    firePopstate: () => listeners.forEach((l) => l()),
    start: () => startGoogleAnalytics(win, doc, ID),
  };
}

/** Everything GA could have seen: gtag arguments, the dataLayer, the script URLs. */
function gaPayload(b: ReturnType<typeof fakeBrowser>): string {
  return JSON.stringify([
    (b.win.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>)),
    b.scripts.map((s) => s.src),
  ]);
}

// ---- isCredentialLocation ---------------------------------------------------

const CREDENTIAL_URLS = [
  `https://papex.app/r?rid=${SECRET}`,
  `https://papex.app/r?sid=${SECRET}`,
  `https://papex.app/r`,
  `https://papex.app/r/`,
  `https://papex.app/R?rid=${SECRET}`,
  `https://papex.app//r?rid=${SECRET}`,
  `https://papex.app/%72?x=1`,
  // bare paths, no parameter to give them away
  `https://papex.app/w`,
  `https://papex.app/rdh`,
  `https://papex.app/demo/r`,
  `https://papex.app/invite/abc`,
  `https://papex.app/merchant`,
  `https://papex.app/r/demo?sid=${SECRET}`,
  `https://papex.app/demo/r?sid=${SECRET}`,
  `https://papex.app/w?sid=${SECRET}`,
  `https://papex.app/rdh?sid=${SECRET}`,
  `https://papex.app/rdh/${SECRET}`,
  `https://papex.app/invite/${SECRET}`,
  `https://papex.app/merchant/tx/${SECRET}`,
  `https://links.papex.app/r?rid=${SECRET}&save=1`,
  `https://links.papex.app/rdh?sid=${SECRET}`,
  `https://merchant.papex.app/`,
  `https://merchant.papex.app/tx/${SECRET}`,
  `http://merchant.localhost:3001/tx/${SECRET}`,
  // credential parameters on any page, in the query or the hash, any case
  `https://papex.app/?rid=${SECRET}`,
  `https://papex.app/customers?utm_source=a&sid=${SECRET}`,
  `https://papex.app/blog?Token=${SECRET}`,
  `https://papex.app/about#rid=${SECRET}`,
  `https://papex.app/about#/x?sid=${SECRET}`,
  `https://papex.app/about?%72id=${SECRET}`,
  `https://papex.app/about?access_token=${SECRET}`,
];

const CLEAN_URLS = [
  "https://papex.app/",
  "https://papex.app/customers",
  "https://papex.app/business?utm_source=newsletter&utm_campaign=fall",
  "https://papex.app/blog",
  "https://papex.app/blog/my-first-post",
  "https://papex.app/blog/r/x", // "/r" only counts as the first segment
  "https://papex.app/privacy",
  "https://papex.app/terms#section-4",
  "https://papex.app/support",
  "https://papex.app/about?ridge=1", // not the rid parameter
  // Look-alikes that merely START with a credential prefix.
  "https://papex.app/reports",
  "https://papex.app/wiki",
  "https://papex.app/invitee",
  "https://papex.app/demos",
  "https://papex.app/rdhx",
  "https://papex.app/merchants",
  "https://links.papex.app/",
  "https://www.papex.app/",
];

test("isCredentialLocation: every credential URL form is recognised", () => {
  for (const href of CREDENTIAL_URLS) assert.equal(isCredentialLocation(loc(href)), true, href);
});

test("isCredentialLocation: ordinary pages are not", () => {
  for (const href of CLEAN_URLS) assert.equal(isCredentialLocation(loc(href)), false, href);
});

test("isCredentialLocation: an undecodable path fails closed", () => {
  assert.equal(isCredentialLocation({ pathname: "/%E0%A4%A", search: "", hash: "" }), true);
});

test("CREDENTIAL_PARAMS are lower case and cover sid, rid, token", () => {
  for (const p of CREDENTIAL_PARAMS) assert.equal(p, p.toLowerCase());
  for (const p of ["sid", "rid", "token"]) assert.ok(CREDENTIAL_PARAMS.includes(p), p);
});

test("CREDENTIAL_PATH_PREFIXES are root-anchored, lower case, with no trailing slash", () => {
  for (const p of CREDENTIAL_PATH_PREFIXES) assert.match(p, /^\/[a-z]+$/, p);
});

// ---- isCredentialReferrer ---------------------------------------------------

test("isCredentialReferrer: our own credential URLs are, nothing else is", () => {
  const self = { hostname: "papex.app" };
  assert.equal(isCredentialReferrer("", self), false);
  assert.equal(isCredentialReferrer(`https://papex.app/r?rid=${SECRET}`, self), true);
  assert.equal(isCredentialReferrer(`https://papex.app/w?sid=${SECRET}`, self), true);
  assert.equal(isCredentialReferrer(`https://links.papex.app/rdh?sid=${SECRET}`, self), true);
  assert.equal(isCredentialReferrer("https://merchant.papex.app/", self), true);
  assert.equal(isCredentialReferrer(`http://localhost:3001/r?sid=${SECRET}`, { hostname: "localhost" }), true);
  assert.equal(isCredentialReferrer("https://papex.app/customers", self), false);
  assert.equal(isCredentialReferrer("https://papex.app/", self), false);
  // Another site's /r/… is not ours to judge (reddit.com/r/privacy).
  assert.equal(isCredentialReferrer("https://www.reddit.com/r/privacy/", self), false);
  assert.equal(isCredentialReferrer("https://www.google.com/", self), false);
  // An unparsable referrer fails closed.
  assert.equal(isCredentialReferrer("not a url", self), true);
});

// ---- GA is present on ordinary pages ----------------------------------------

test("ordinary pages: GA starts once, with a bare config call and the gtag.js tag", () => {
  for (const href of CLEAN_URLS) {
    const b = fakeBrowser(href);
    assert.equal(b.start(), "loaded", href);
    assert.equal(b.scripts.length, 1, href);
    assert.equal(b.scripts[0].src, `${GTAG_SRC}?id=${ID}`, href);
    assert.equal(b.scripts[0].async, true, href);
    assert.equal(typeof b.win.gtag, "function", href);
    const calls = (b.win.dataLayer ?? []).map((e) => Array.from(e as ArrayLike<unknown>));
    assert.equal(calls.length, 2, href);
    assert.equal(calls[0][0], "js");
    assert.deepEqual(calls[1], ["config", ID], "config carries only the measurement id");
    assert.equal(b.win[FLAG], undefined, "kill switch left alone");
  }
});

test("ordinary pages: dataLayer entries are `arguments` objects, as gtag.js requires", () => {
  const b = fakeBrowser("https://papex.app/customers");
  b.start();
  for (const entry of b.win.dataLayer ?? []) {
    assert.equal(Object.prototype.toString.call(entry), "[object Arguments]");
  }
});

test("ordinary pages: an external referrer does not stop GA", () => {
  for (const ref of ["", "https://www.google.com/", "https://www.reddit.com/r/privacy/", "https://papex.app/customers"]) {
    const b = fakeBrowser("https://papex.app/", ref);
    assert.equal(b.start(), "loaded", ref);
    assert.equal(b.scripts.length, 1, ref);
  }
});

// ---- GA is absent on credential URLs ----------------------------------------

test("credential URLs: GA never starts — no script, no gtag, no dataLayer, kill switch set", () => {
  for (const href of CREDENTIAL_URLS) {
    const b = fakeBrowser(href);
    assert.equal(b.start(), "blocked", href);
    assert.equal(b.scripts.length, 0, href);
    assert.equal(b.win.gtag, undefined, href);
    assert.equal(b.win.dataLayer, undefined, href);
    assert.equal(b.win[FLAG], true, href);
  }
});

test("credential URLs: no credential value reaches a gtag call, the dataLayer or the script URL", () => {
  for (const href of [...CREDENTIAL_URLS, ...CLEAN_URLS]) {
    const b = fakeBrowser(href, `https://papex.app/r?rid=${SECRET}`);
    b.start();
    assert.ok(!gaPayload(b).includes(SECRET), href);
  }
  for (const href of [...CREDENTIAL_URLS, ...CLEAN_URLS]) {
    const b = fakeBrowser(href);
    b.start();
    assert.ok(!gaPayload(b).includes(SECRET), href);
  }
});

test("referrer: a document reached from a credential URL never starts GA (no rid as page_referrer)", () => {
  for (const ref of [
    `https://papex.app/r?rid=${SECRET}`,
    `https://papex.app/r?sid=${SECRET}`,
    `https://papex.app/rdh?sid=${SECRET}`,
    `https://links.papex.app/r?rid=${SECRET}&save=1`,
    "https://merchant.papex.app/",
    "garbage",
  ]) {
    const b = fakeBrowser("https://papex.app/customers", ref);
    assert.equal(b.start(), "blocked", ref);
    assert.equal(b.scripts.length, 0, ref);
    assert.equal(b.win.dataLayer, undefined, ref);
    assert.equal(b.win[FLAG], true, ref);
  }
});

test("a kill switch somebody else already set is respected", () => {
  const b = fakeBrowser("https://papex.app/customers");
  b.win[FLAG] = true;
  assert.equal(b.start(), "blocked");
  assert.equal(b.scripts.length, 0);
});

// ---- client-side navigation -------------------------------------------------

test("navigation INTO a credential URL switches GA off before the URL changes", () => {
  for (const method of ["pushState", "replaceState"] as const) {
    const b = fakeBrowser("https://papex.app/customers");
    assert.equal(b.start(), "loaded");
    assert.equal(b.win[FLAG], undefined);

    b.win.history[method](null, "", `/r?rid=${SECRET}`);

    const call = b.nativeCalls.find((c) => c.method === method);
    assert.ok(call, "the native method still ran");
    assert.equal(call.flagAtCall, true, "kill switch was already set when the URL changed");
    assert.equal(call.url, `/r?rid=${SECRET}`, "arguments forwarded untouched");
    assert.equal(b.win[FLAG], true);
  }
});

test("navigation into a credential URL via URL object, absolute URL and /w, /rdh, /invite", () => {
  for (const target of [
    new URL(`https://papex.app/w?sid=${SECRET}`),
    `https://papex.app/rdh?sid=${SECRET}`,
    `/invite/${SECRET}`,
    `/merchant/tx/${SECRET}`,
    `/?rid=${SECRET}`,
  ]) {
    const b = fakeBrowser("https://papex.app/");
    b.start();
    b.win.history.pushState(null, "", target);
    assert.equal(b.win[FLAG], true, String(target));
  }
});

test("navigation between ordinary pages leaves GA running", () => {
  const b = fakeBrowser("https://papex.app/");
  b.start();
  b.win.history.pushState(null, "", "/customers");
  b.win.history.replaceState({ scroll: 1 }, "");
  b.win.history.replaceState({ scroll: 2 }, "", null);
  b.win.history.pushState(null, "", "/business?utm_source=x");
  assert.equal(b.win[FLAG], undefined);
  assert.equal(b.nativeCalls.length, 4, "every call reached the native method");
});

test("back/forward onto a credential URL (popstate) switches GA off", () => {
  const b = fakeBrowser("https://papex.app/customers");
  b.start();
  b.setLocation(`/r?rid=${SECRET}`);
  b.firePopstate();
  assert.equal(b.win[FLAG], true);
});

test("sticky: after a credential URL, GA stays off on clean pages, and never starts late", () => {
  // Loaded first, then a credential URL, then back to a clean page.
  const a = fakeBrowser("https://papex.app/");
  a.start();
  a.win.history.pushState(null, "", `/r?rid=${SECRET}`);
  a.win.history.pushState(null, "", "/customers");
  assert.equal(a.win[FLAG], true);
  assert.equal(a.start(), "blocked", "an effect re-run on the clean page does not revive GA");

  // Started on a credential URL, then a client-side navigation away from it
  // (the "page_view with the rid as referrer" case): GA must not load now.
  const b = fakeBrowser(`https://papex.app/r?rid=${SECRET}`);
  assert.equal(b.start(), "blocked");
  b.win.history.pushState(null, "", "/customers");
  assert.equal(b.start(), "blocked");
  assert.equal(b.scripts.length, 0);
  assert.equal(b.win.dataLayer, undefined);
  assert.ok(!gaPayload(b).includes(SECRET));
});

test("idempotent: starting twice (strict mode, HMR) loads once and wraps history once", () => {
  const b = fakeBrowser("https://papex.app/");
  b.start();
  b.start();
  assert.equal(b.scripts.length, 1);
  assert.equal((b.win.dataLayer ?? []).length, 2);
  b.win.history.pushState(null, "", "/customers");
  assert.equal(b.nativeCalls.length, 1, "pushState was wrapped once, not twice");
});

test("the history wrapper keeps `this` and still navigates", () => {
  const b = fakeBrowser("https://papex.app/");
  b.start();
  b.win.history.pushState({ a: 1 }, "", "/business");
  assert.equal(b.nativeCalls[0].self, b.win.history);
  assert.equal(b.win.location.pathname, "/business");
});

// ---- every route is classified ----------------------------------------------
//
// The deny-list only protects routes it knows about. A new top-level route under
// app/ must be put in CREDENTIAL_PATH_PREFIXES (if its URL can carry a
// receipt/invite/merchant credential) or in PUBLIC below (if it cannot), so a
// new credential route cannot ship with GA on it. This is the test that fails.

const PUBLIC = [
  "/about",
  "/app-kit-gallery",
  "/app-support",
  "/blog",
  "/business",
  "/customers",
  "/dashboard", // blog CMS: login is Firebase auth, no credential in the URL
  "/pci",
  "/pos-calculator",
  "/privacy",
  "/support",
  "/terms",
];

function hasPage(dir: string): boolean {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (hasPage(p)) return true;
    } else if (/^page\.(tsx|ts|jsx|js)$/.test(name)) return true;
  }
  return false;
}

test("every top-level page route under app/ is classified as credential or public", () => {
  const appDir = join(__dirname, "..", "app");
  assert.ok(existsSync(appDir));
  const routes = readdirSync(appDir)
    .filter((n) => statSync(join(appDir, n)).isDirectory() && !n.startsWith("_") && !n.startsWith("("))
    .filter((n) => hasPage(join(appDir, n)))
    .map((n) => `/${n}`);
  assert.ok(routes.includes("/r") && routes.includes("/w"), "control: the scan sees the receipt routes");
  const known = new Set<string>([...CREDENTIAL_PATH_PREFIXES, ...PUBLIC]);
  const unclassified = routes.filter((r) => !known.has(r));
  assert.deepEqual(
    unclassified,
    [],
    `new route(s) ${unclassified.join(", ")}: add to CREDENTIAL_PATH_PREFIXES in lib/analyticsGate.ts if the URL can carry a ` +
      `credential (sid/rid/token), else to PUBLIC in lib/analyticsGate.test.ts`,
  );
  // And the reverse: no stale entries.
  for (const prefix of CREDENTIAL_PATH_PREFIXES) assert.ok(routes.includes(prefix), `${prefix} has no route any more`);
  for (const p of PUBLIC) assert.ok(routes.includes(p), `${p} has no route any more`);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
