// app/w/wPage.test.tsx
//
// `/w` = `/r` without the App Clip. Standalone tsx script:
//   npm run test:w
//
// RDH unit 003 (Union Street) broadcasts papex.app/w?sid= so iPhones open
// Safari rather than the App Clip. That holds only while /w emits no Smart App
// Banner meta and stays out of the AASA, so both are pinned here, alongside
// "/w renders exactly what /r renders" and "canonical / og:url still say /r".

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { finish, test, RDH, bytes, renderHtml, setUpstreams, status } from "../r/testPageHarness";
import ReceiptPage, { generateMetadata as rMetadata } from "../r/page";
import WPage, { generateMetadata as wMetadata } from "./page";
import { withoutAppClipBanner } from "@/lib/appClipBanner";
import { DUTCHIE_BUNDLE_BYTES_B64 } from "@/lib/__fixtures__/dutchieParsed";

const SID = "d0c0ffee00000002";
const sp = (p: Record<string, string>) => ({ searchParams: Promise.resolve(p) });
const banner = (m: { other?: Record<string, unknown> }) => m.other?.["apple-itunes-app"];

async function withRidBanner<T>(fn: () => Promise<T>): Promise<T> {
  const before = process.env.RID_APP_CLIP_BANNER;
  process.env.RID_APP_CLIP_BANNER = "1";
  try {
    return await fn();
  } finally {
    if (before === undefined) delete process.env.RID_APP_CLIP_BANNER;
    else process.env.RID_APP_CLIP_BANNER = before;
  }
}

async function main() {
  await test("/w?sid= has no apple-itunes-app meta; /r?sid= still does", async () => {
    const r = await rMetadata(sp({ sid: SID }));
    const w = await wMetadata(sp({ sid: SID }));
    assert.ok(banner(r), "control: /r carries the banner");
    assert.equal(banner(w), undefined);
    assert.equal(w.other, undefined, "no other metas at all on /w");
    assert.equal(w.itunes, undefined);
    assert.equal(w.appLinks, undefined);
  });

  await test("/w?rid= has no banner even with RID_APP_CLIP_BANNER=1", async () => {
    const rid = "receipt_1776344585632_4mrd9txmk";
    const [r, w] = await withRidBanner(() => Promise.all([rMetadata(sp({ rid })), wMetadata(sp({ rid }))]));
    assert.ok(banner(r), "control: /r?rid= carries the banner when enabled");
    assert.equal(banner(w), undefined);
  });

  await test("canonical and og:url stay on /r (Messages 'View' + share links)", async () => {
    const r = await rMetadata(sp({ sid: SID }));
    const w = await wMetadata(sp({ sid: SID }));
    assert.equal(w.alternates?.canonical, `https://papex.app/r?sid=${SID}`);
    assert.deepEqual(w.openGraph, r.openGraph);
    assert.deepEqual({ ...w, other: undefined }, { ...r, other: undefined });
  });

  await test("/w renders exactly what /r renders", async () => {
    const upstreams = {
      [`${RDH}/receipt/${SID}`]: bytes(Uint8Array.from(Buffer.from(DUTCHIE_BUNDLE_BYTES_B64, "base64"))),
      [`${RDH}/receipt/${SID}/parsed`]: status(404),
    };
    setUpstreams(upstreams);
    const r = await renderHtml(await ReceiptPage(sp({ sid: SID })));
    setUpstreams(upstreams);
    const w = await renderHtml(await WPage(sp({ sid: SID })));
    assert.ok(r.includes("Union Cannabis Club"), "control: the receipt rendered");
    assert.equal(w, r);
  });

  await test("withoutAppClipBanner keeps unrelated metas", () => {
    const m = withoutAppClipBanner({
      title: "t",
      other: { "apple-itunes-app": "x", "format-detection": "telephone=no" },
      itunes: { appId: "1" },
    });
    assert.deepEqual(m, { title: "t", other: { "format-detection": "telephone=no" } });
  });

  await test("/w is not in the AASA (universal links / App Clip would claim it)", () => {
    const aasa = JSON.parse(readFileSync(join(process.cwd(), "public/.well-known/apple-app-site-association"), "utf8"));
    const paths: string[] = aasa.applinks.details.flatMap((d: { paths?: string[] }) => d.paths ?? []);
    assert.ok(paths.includes("/r"), "control: /r is there");
    assert.ok(!paths.some((p) => p === "*" || p === "/*" || p.startsWith("/w")), `AASA paths: ${paths.join(", ")}`);
  });

  finish();
}

void main();
