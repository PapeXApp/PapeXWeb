// app/r/receiptPage.parity.test.tsx
//
// PARITY LOCK for production `/r` and the demo routes. Standalone tsx script:
//   npm run test:rParity
//   npx tsx --tsconfig tsconfig.test.json app/r/receiptPage.parity.test.tsx --update   (rewrite goldens)
//
// The goldens under ./__parity__/ were rendered at the commit BEFORE receipt
// cards reached production `/r` (feat/cards-v1-web, the first commit on top of
// 7bce460). They are the definition of "today's page". Every URL shape the
// page serves is here: ?sid= (text, raster awaiting OCR, raster already
// parsed, /parsed failing), ?rid= (the 4adb368 fix), sid+rid (sid wins),
// unknown and malformed sids, backend errors, the bare sample, ?demo=1, the
// three demo sids on /r (no Save), /r/demo and /demo/r (the value layer), and
// the Smart App Banner rules (sid always; rid only with RID_APP_CLIP_BANNER=1).
//
// Each scenario must render byte-identical HTML and make the same upstream
// calls. The one call a later commit may ADD is `GET /receipt/{sid}/cards`,
// and only for a well-formed, non-demo sid on the /r sid path; this test
// fails if `/cards` is called for anything else (demo sids, rid, the sample,
// a malformed sid, the demo routes). With no cards service answering (every
// URL without a canned answer is a 404, i.e. "not deployed"), the page must
// be exactly today's.
//
// NEVER regenerate the goldens to make a cards change pass. A golden diff
// means production `/r` changed for a customer who gets no cards.

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { finish, test } from "./testPageHarness";
import { runMetadata, runScenario } from "./testRunScenario";
import { METADATA_CASES, SCENARIOS } from "./testParityScenarios";

const UPDATE = process.argv.includes("--update");
const DIR = join(__dirname, "__parity__");
const INDEX = join(DIR, "INDEX.json");

interface Golden {
  sha256: string;
  redirect: string | null;
  /** Upstream calls other than /cards, in order. */
  urls: string[];
}
interface GoldenIndex {
  note: string;
  scenarios: Record<string, Golden>;
  metadata: Record<string, unknown>;
}

const ok: (v: unknown, msg?: string) => asserts v = assert.ok;
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const isCardsCall = (u: string) => /\/receipt\/[a-f0-9]{16}\/cards(\?|$)/.test(u);

async function main() {
  const index: GoldenIndex = UPDATE
    ? { note: "Rendered before receipt cards reached production /r. Do not regenerate for a cards change.", scenarios: {}, metadata: {} }
    : (JSON.parse(readFileSync(INDEX, "utf8")) as GoldenIndex);
  if (UPDATE) mkdirSync(DIR, { recursive: true });

  for (const s of SCENARIOS) {
    await test(`${s.route} ${JSON.stringify(s.params)} (${s.name}) renders exactly today's page`, async () => {
      const r = await runScenario(s);
      const urls = r.urls.filter((u) => !isCardsCall(u));
      if (UPDATE) {
        if (r.html) writeFileSync(join(DIR, `${s.name}.html`), r.html);
        index.scenarios[s.name] = { sha256: sha(r.html), redirect: r.redirect, urls };
        return;
      }
      const g = index.scenarios[s.name];
      ok(g, `no golden for ${s.name}`);
      assert.equal(r.redirect, g.redirect, "redirect");
      assert.deepEqual(urls, g.urls, "upstream calls (other than /cards)");
      if (sha(r.html) !== g.sha256) {
        const file = join(DIR, `${s.name}.html`);
        const want = existsSync(file) ? readFileSync(file, "utf8") : "";
        let i = 0;
        while (i < want.length && want[i] === r.html[i]) i++;
        assert.fail(`HTML differs from golden at byte ${i}:\n  want …${want.slice(Math.max(0, i - 80), i + 120)}\n  got  …${r.html.slice(Math.max(0, i - 80), i + 120)}`);
      }
    });

    await test(`${s.name}: /cards is ${s.cardsSid ? "only ever asked about this sid" : "never called"}`, async () => {
      const r = await runScenario(s);
      const cards = r.urls.filter(isCardsCall);
      if (!s.cardsSid) assert.deepEqual(cards, [], "a demo sid, rid link, sample or demo route never calls /cards");
      else for (const u of cards) ok(u.includes(`/receipt/${s.cardsSid}/cards?`), u);
    });
  }

  await test("/demo/r renders byte-identically to /r/demo (a re-export, not a copy)", () => {
    assert.equal(index.scenarios["demo-r-hartwells"]?.sha256, index.scenarios["r-demo-hartwells"]?.sha256);
    assert.equal(index.scenarios["demo-r-ellsworth"]?.sha256, index.scenarios["r-demo-ellsworth"]?.sha256);
  });

  await test("demo sids on /r never offer Save; a real sid does", () => {
    for (const name of ["r-hartwells", "r-ellsworth", "r-sunset-leaf"]) {
      const html = readFileSync(join(DIR, `${name}.html`), "utf8");
      ok(!/Save to PapeX/i.test(html), `${name} offers Save`);
    }
    ok(/Save to PapeX/i.test(readFileSync(join(DIR, "sid-text.html"), "utf8")), "sid-text offers Save");
  });

  for (const c of METADATA_CASES) {
    await test(`generateMetadata ${JSON.stringify(c.params)}${c.ridBannerEnv ? " RID_APP_CLIP_BANNER=1" : ""} (${c.name})`, async () => {
      const m = await runMetadata(c.params, c.ridBannerEnv);
      if (UPDATE) {
        index.metadata[c.name] = m;
        return;
      }
      assert.deepEqual(m, index.metadata[c.name]);
    });
  }

  await test("Smart App Banner: sid always; rid only when RID_APP_CLIP_BANNER=1", () => {
    const banner = (name: string) =>
      JSON.stringify(index.metadata[name] ?? {}).includes("app-clip-bundle-id=com.app.papex.Clip");
    ok(banner("sid") && banner("sid-demo-sid") && banner("sid-malformed") && banner("sid-and-rid"));
    ok(!banner("rid-flag-off") && banner("rid-flag-on"));
    ok(!banner("bare") && !banner("demo-flag"));
  });

  if (UPDATE) writeFileSync(INDEX, JSON.stringify(index, null, 2) + "\n");
  finish();
}

main();
