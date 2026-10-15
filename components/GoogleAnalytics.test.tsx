// components/GoogleAnalytics.test.tsx
//
// Standalone test script (no test framework in this repo — see package.json).
// Run with:
//   npm run test:gaWiring
//
// Issue #53. lib/analyticsGate.test.ts proves the gate's behaviour; this file
// proves the gate is the ONLY way GA gets into the site and that the receipt
// routes carry the Referrer-Policy header:
//   1. the component renders nothing, so no server HTML of any route (/r
//      included) can contain the GA tag;
//   2. app/layout.tsx mounts the component and carries no GA tag of its own;
//   3. no other source file loads gtag.js, calls gtag(), or sets the kill
//      switch behind the gate's back (a new unconditional tag would put GA
//      back on /r);
//   4. (also #53) Vercel Web Analytics is mounted only through
//      components/VercelAnalytics.tsx, whose beforeSend redacts credential URLs
//      (the redaction itself is tested in lib/analyticsGate.test.ts);
//   5. next.config.ts sends `Referrer-Policy: no-referrer` for every
//      credential route and for the merchant host, and for nothing site-wide.

import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import GoogleAnalytics from "./GoogleAnalytics";
import VercelAnalytics from "./VercelAnalytics";
import { CREDENTIAL_PATH_PREFIXES } from "../lib/analyticsGate";
import nextConfig from "../next.config";

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok - ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL - ${name}`);
    console.error(err instanceof Error ? err.message : err);
  }
}

const ROOT = join(__dirname, "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === "__parity__" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) sourceFiles(p, out);
    else if (/\.(tsx?|jsx?|mjs|html)$/.test(name) && !/\.test\.[tj]sx?$/.test(name)) out.push(p);
  }
  return out;
}

async function main() {
  await test("the component renders no markup, so no route's HTML carries the GA tag", () => {
    assert.equal(renderToStaticMarkup(<GoogleAnalytics measurementId="G-TEST123456" />), "");
  });

  await test("app/layout.tsx mounts the gated component and has no GA tag of its own", () => {
    const layout = read("app/layout.tsx");
    assert.match(layout, /<GoogleAnalytics measurementId=\{GA_MEASUREMENT_ID\} \/>/);
    for (const banned of ["googletagmanager", "gtag(", "dataLayer", "next/script", "<Script"]) {
      assert.ok(!layout.includes(banned), `app/layout.tsx must not contain ${banned}`);
    }
  });

  await test("nothing else in the repo starts GA outside lib/analyticsGate.ts", () => {
    const dirs = ["app", "components", "lib", "hooks", "public", "scripts"].map((d) => join(ROOT, d));
    const files = [...dirs.flatMap((d) => sourceFiles(d)), join(ROOT, "middleware.ts"), join(ROOT, "next.config.ts")];
    assert.ok(files.length > 100, "control: the scan found the source tree");
    const gate = join(ROOT, "lib", "analyticsGate.ts");
    const banned = ["googletagmanager", "gtag(", "@next/third-parties", "google-analytics.com", "ga-disable-"];
    for (const file of files) {
      if (file === gate) continue;
      const text = readFileSync(file, "utf8");
      for (const needle of banned) {
        // Comments that explain the gate may name these; code may not.
        const code = text
          .split("\n")
          .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
          .join("\n");
        assert.ok(!code.includes(needle), `${relative(ROOT, file)} contains ${needle}: route GA through lib/analyticsGate.ts`);
      }
    }
    // Control: the scan does see the gate itself.
    assert.ok(readFileSync(gate, "utf8").includes("googletagmanager"));
  });

  await test("Vercel Analytics: mounted only via components/VercelAnalytics.tsx, with the redacting beforeSend", () => {
    const layout = read("app/layout.tsx");
    assert.match(layout, /<VercelAnalytics \/>/);
    assert.ok(!/from\s+["']@vercel\/analytics/.test(layout), "app/layout.tsx must not import @vercel/analytics directly");

    const dirs = ["app", "components", "lib", "hooks"].map((d) => join(ROOT, d));
    const users = dirs
      .flatMap((d) => sourceFiles(d))
      .filter((f) => /from\s+["']@vercel\/analytics/.test(readFileSync(f, "utf8")))
      .map((f) => relative(ROOT, f));
    assert.deepEqual(users, ["components/VercelAnalytics.tsx"], "any other <Analytics /> would bypass the redaction");

    assert.equal(renderToStaticMarkup(<VercelAnalytics />), "");

    // The prop the real <Analytics /> receives: run it as the browser would.
    const element = VercelAnalytics() as { props: { beforeSend: (e: { type: string; url: string }) => { type: string; url: string } | null } };
    const g = globalThis as unknown as Record<string, unknown>;
    const saved = { document: g.document, window: g.window };
    try {
      g.document = { referrer: "" };
      g.window = { location: { hostname: "papex.app" } };
      const send = element.props.beforeSend;
      assert.deepEqual(send({ type: "pageview", url: "https://papex.app/invite/SECRETtoken" }), {
        type: "pageview",
        url: "https://papex.app/invite/[token]",
      });
      assert.deepEqual(send({ type: "pageview", url: "https://papex.app/r?rid=SECRETrid" }), { type: "pageview", url: "https://papex.app/r" });
      const normal = { type: "pageview", url: "https://papex.app/customers?utm_source=x" };
      assert.equal(send(normal), normal);
      g.document = { referrer: "https://papex.app/r?rid=SECRETrid" };
      assert.equal(send(normal), null, "credential referrer: the event is dropped");
    } finally {
      g.document = saved.document;
      g.window = saved.window;
    }
  });

  await test("next.config.ts: Referrer-Policy no-referrer on every credential route and the merchant host", async () => {
    const rules = await nextConfig.headers!();
    const policy = (r: { headers: { key: string; value: string }[] }) =>
      r.headers.find((h) => h.key === "Referrer-Policy")?.value;
    const withPolicy = rules.filter((r) => policy(r) !== undefined);

    for (const prefix of CREDENTIAL_PATH_PREFIXES) {
      for (const source of [prefix, `${prefix}/:path*`]) {
        const rule = withPolicy.find((r) => r.source === source && !r.has);
        assert.ok(rule, `no Referrer-Policy rule for ${source}`);
        assert.equal(policy(rule), "no-referrer", source);
      }
    }
    const merchantHost = withPolicy.find((r) => r.has?.some((h) => h.type === "host" && new RegExp(`^${h.value}$`).test("merchant.papex.app")));
    assert.ok(merchantHost, "no Referrer-Policy rule for the merchant host");
    assert.equal(policy(merchantHost), "no-referrer");
    assert.ok(!new RegExp(`^${merchantHost.has![0].value}$`).test("papex.app"), "the host rule must not match the main site");

    // Nothing else gets the policy: no site-wide rule (it would change every
    // marketing page's referrer behaviour for no reason).
    for (const r of withPolicy) {
      const ok = CREDENTIAL_PATH_PREFIXES.some((p) => r.source === p || r.source === `${p}/:path*`) || r === merchantHost;
      assert.ok(ok, `unexpected Referrer-Policy rule on ${r.source}`);
    }
  });

  await test("next.config.ts: the AASA / assetlinks header rules are untouched", async () => {
    const rules = await nextConfig.headers!();
    for (const source of [
      "/.well-known/assetlinks.json",
      "/.well-known/apple-app-site-association",
      "/apple-app-site-association",
    ]) {
      const rule = rules.find((r) => r.source === source);
      assert.ok(rule, source);
      assert.deepEqual(
        rule.headers.map((h) => h.key).sort(),
        ["Cache-Control", "Content-Type"],
        `${source} keeps exactly its two headers`,
      );
      assert.equal(rule.headers.find((h) => h.key === "Content-Type")?.value, "application/json");
    }
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
