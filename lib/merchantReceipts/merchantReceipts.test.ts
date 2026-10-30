// lib/merchantReceipts/merchantReceipts.test.ts
//
// Run with: npm run test:merchantReceipts
//
// PARITY    the browser's resolver and mock lint answer what the REAL ones
//           answered (__fixtures__/parity.json, written by Papex_RDH
//           scripts/cards-editor-parity.mjs: re-run it after changing either).
// DRAFT     the editor's model round-trips the config, and writes only real fields.
// LANGUAGE  every issue the lint can raise comes out as a sentence, not a path.
// MOCK      the mock API merges and versions the way the real route does.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { draftToConfig, fromConfig, isManagedCard, newOffer, offersFor, toConfigInput } from "./draft";
import { lintMirror, type LintableDoc } from "./lint";
import { MOCK_CARD_CONFIG } from "./mockConfig";
import { describeIssue, describeIssues } from "./plainLanguage";
import { resolveConfig } from "./resolve";
import { LOYALTY_SEGMENTS, type CardConfig, type LiveSurface, type LoyaltySegment } from "./types";
import { mockGetCardConfig, mockGetPreviewReceiptBytes, mockPublishCardConfig } from "../merchantMock";
import { parseEscPos } from "../escpos";
import { summarizeReceipt } from "../receiptSummary";

const here = dirname(fileURLToPath(import.meta.url));

interface ParityCase {
  name: string;
  doc: LintableDoc;
  errors: { path: string; code: string }[];
  warnings: { path: string; code: string }[];
  resolved: Record<string, { status: string; merchant: unknown; layout: unknown; cards: unknown[] }>;
}
const PARITY = JSON.parse(readFileSync(join(here, "__fixtures__", "parity.json"), "utf8")) as { now: string; sid: string; cases: ParityCase[] };
const NOW = new Date(PARITY.now);

let passed = 0;
function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
    })
    .catch((err) => {
      console.error(`FAIL ${name}`);
      throw err;
    });
}

const pairs = (list: { path: string; code: string }[]) => [...new Set(list.map((x) => `${x.path} ${x.code}`))].sort();

async function main() {
  // ---- PARITY ---------------------------------------------------------------
  for (const c of PARITY.cases) {
    await test(`lint parity: ${c.name}`, () => {
      const mine = lintMirror(c.doc, NOW);
      assert.equal(mine.errors.length > 0, c.errors.length > 0, `${c.name}: verdict (mine ${JSON.stringify(mine.errors)}, real ${JSON.stringify(c.errors)})`);
      const real = new Set(pairs(c.errors));
      for (const p of pairs(mine.errors)) assert.ok(real.has(p), `${c.name}: mirror raised ${p}, real raised ${[...real].join(", ")}`);
      // Anything past the schema step is the same rule in both.
      const beyondSchema = (l: { path: string; code: string }[]) => pairs(l.filter((x) => x.code !== "config_schema"));
      assert.deepEqual(beyondSchema(mine.errors), beyondSchema(c.errors), `${c.name}: non-schema errors`);
      assert.deepEqual(pairs(mine.warnings), pairs(c.warnings), `${c.name}: warnings`);
    });
    if (c.errors.length > 0) continue;
    for (const [key, want] of Object.entries(c.resolved)) {
      const [surface, segment] = key.split("/") as [LiveSurface, LoyaltySegment];
      await test(`resolve parity: ${c.name} ${key}`, () => {
        const { envelope } = resolveConfig({ config: c.doc, sid: PARITY.sid, now: NOW, surface, segment, uploadedAt: NOW });
        assert.equal(envelope.status, want.status);
        assert.deepEqual(envelope.merchant, want.merchant);
        assert.deepEqual(envelope.layout ?? null, want.layout);
        assert.deepEqual(envelope.cards, want.cards);
      });
    }
  }

  await test("the goldens are worth something: real errors and a real segment split", () => {
    assert.ok(PARITY.cases.filter((c) => c.errors.length > 0).length >= 20);
    const base = PARITY.cases.find((c) => c.name === "base")!;
    const code = (seg: string) => (base.resolved[`web/${seg}`].cards[0] as { redemption: { code: string } }).redemption.code;
    assert.equal(code("first"), "WELCOME20");
    assert.equal(code("returning"), "MEMBER10");
  });

  await test("the mock config is the seed config, minus what the API never sends", () => {
    const base = PARITY.cases.find((c) => c.name === "base")!.doc;
    assert.deepEqual(MOCK_CARD_CONFIG.offers, base.offers);
    assert.deepEqual(MOCK_CARD_CONFIG.cards, base.cards);
    assert.deepEqual(MOCK_CARD_CONFIG.merchant, base.merchant);
    assert.equal(MOCK_CARD_CONFIG.compliance?.licenseLine, base.compliance?.licenseLine);
  });

  // ---- DRAFT ----------------------------------------------------------------
  const draft = fromConfig(MOCK_CARD_CONFIG);

  await test("draft: the seed config survives a round trip unchanged", () => {
    const back = toConfigInput(draft);
    assert.deepEqual(back.offers, MOCK_CARD_CONFIG.offers);
    assert.deepEqual(back.cards, MOCK_CARD_CONFIG.cards);
    assert.equal(back.enabled, true);
    assert.deepEqual(back.layout, { order: "receipt-first" });
  });

  await test("draft: Doobie's shape round-trips too, and is one draft per offer", () => {
    const seg = (value: string[]) => ({ fact: "receipt.loyalty.segment", op: "in", value });
    const doobieLike: CardConfig = {
      ...MOCK_CARD_CONFIG,
      cards: [
        { id: "dn-a-app", surfaces: ["preview", "app"], priority: 10, when: seg(["first", "none", "no_points"]), type: "offer", offer: "sl-welcome", heading: "H", actions: [{ type: "save", label: "Save to PapeX" }] },
        { id: "dn-a-web", surfaces: ["preview", "web", "clip"], priority: 10, when: seg(["first", "none", "no_points"]), type: "offer", offer: "sl-welcome", heading: "H" },
        { id: "dn-b-app", surfaces: ["preview", "app"], priority: 20, when: seg(["returning", "unknown"]), type: "offer", offer: "sl-member", heading: "H2", actions: [{ type: "save", label: "Save to PapeX" }] },
        { id: "dn-b-web", surfaces: ["preview", "web", "clip"], priority: 20, when: seg(["returning", "unknown"]), type: "offer", offer: "sl-member", heading: "H2" },
      ],
    };
    const d = fromConfig(doobieLike);
    assert.deepEqual(d.offers.map((o) => o.id), ["sl-welcome", "sl-member"]);
    assert.deepEqual(d.offers[0].segments, ["first", "none", "no_points"]);
    const ids = toConfigInput(d).cards.map((c) => c.id);
    assert.deepEqual(new Set(ids), new Set(["dn-a-app", "dn-a-web", "dn-b-app", "dn-b-web"]), "card ids are kept");
  });

  await test("draft: off keeps the offer, as a preview-only card with its audience", () => {
    const off = structuredClone(draft);
    off.offers[0].on = false;
    const cards = toConfigInput(off).cards.filter((c) => c.offer === "sl-welcome");
    assert.equal(cards.length, 1);
    assert.deepEqual(cards[0].surfaces, ["preview"]);
    assert.deepEqual((cards[0].when as { value: string[] }).value, ["first", "none", "no_points"]);
    const back = fromConfig({ ...MOCK_CARD_CONFIG, ...toConfigInput(off) });
    assert.equal(back.offers[0].on, false);
    assert.deepEqual(back.offers[0].template, draft.offers[0].template);
  });

  await test("draft: everyone is no rule at all; picking nobody is the schema's error", () => {
    const everyone = structuredClone(draft);
    everyone.offers[0].segments = [...LOYALTY_SEGMENTS];
    assert.equal(toConfigInput(everyone).cards[0].when, undefined);
    const nobody = structuredClone(draft);
    nobody.offers[0].segments = [];
    const doc = { ...draftToConfig(nobody, MOCK_CARD_CONFIG), merchantId: "demo-sunset-leaf-sf" };
    const { errors } = lintMirror(doc, NOW);
    assert.ok(errors.some((e) => e.path === "/cards/0/when"));
    const plain = describeIssues(errors, doc);
    assert.equal(plain[0].offerId, "sl-welcome");
    assert.match(plain[0].text, /at least one customer type/);
  });

  await test("draft: surfaces split into the audiences the schema allows", () => {
    const d = structuredClone(draft);
    d.offers[0].surfaces = ["clip"];
    assert.deepEqual(toConfigInput(d).cards.filter((c) => c.offer === "sl-welcome").map((c) => c.surfaces), [["preview", "clip"]]);
    d.offers[0].surfaces = ["app"];
    const app = toConfigInput(d).cards.filter((c) => c.offer === "sl-welcome");
    assert.deepEqual(app.map((c) => c.surfaces), [["preview", "app"]]);
    assert.deepEqual(app[0].actions, [{ type: "save", label: "Save to PapeX" }]);
    d.offers[0].surfaces = [];
    assert.equal(fromConfig({ ...MOCK_CARD_CONFIG, ...toConfigInput(d) }).offers[0].on, false);
  });

  await test("draft: empty optional boxes are dropped, a required one is not", () => {
    const d = structuredClone(draft);
    d.offers[0].template.kicker = "";
    d.offers[0].template.terms = "";
    d.offers[0].template.title = "";
    d.offers[0].heading = "  ";
    const input = toConfigInput(d);
    assert.equal(input.offers["sl-welcome"].kicker, undefined);
    assert.equal(input.offers["sl-welcome"].terms, undefined);
    assert.equal(input.offers["sl-welcome"].title, "");
    assert.equal(input.cards[0].heading, undefined);
  });

  await test("draft: list order is priority, so moving an offer changes what shows first", () => {
    const d = structuredClone(draft);
    d.offers.reverse();
    for (const o of d.offers) o.segments = [...LOYALTY_SEGMENTS];
    const { envelope } = resolveConfig({ config: draftToConfig(d, MOCK_CARD_CONFIG), sid: PARITY.sid, now: NOW, surface: "web", segment: "first", uploadedAt: NOW });
    assert.deepEqual(envelope.cards.slice(0, 2).map((c) => c.id), ["sl-member-web", "sl-welcome-web"]);
  });

  await test("draft: what the draft can't express passes through untouched", () => {
    const scheduled: CardConfig = {
      ...MOCK_CARD_CONFIG,
      cards: [
        { id: "s1", surfaces: ["web"], type: "offer", offer: "sl-welcome", schedule: { startsAt: "2026-01-01T00:00:00Z" } },
        { id: "note", surfaces: ["web"], type: "text", voice: "merchant", body: "Hi" },
        ...MOCK_CARD_CONFIG.cards.filter((c) => c.offer === "sl-member"),
      ],
    };
    const d = fromConfig(scheduled);
    assert.deepEqual(d.offers.map((o) => o.id), ["sl-member"]);
    const out = toConfigInput(d);
    assert.ok(out.offers["sl-welcome"], "its template stays");
    assert.ok(out.cards.some((c) => c.id === "s1" && c.schedule));
    assert.ok(out.cards.some((c) => c.id === "note"));
  });

  await test("draft: a new offer publishes as it stands, and its id never collides", () => {
    const d = structuredClone(draft);
    d.offers.push(newOffer(d.offers, true));
    d.offers.push(newOffer(d.offers, true));
    assert.equal(new Set(d.offers.map((o) => o.id)).size, 4);
    const doc = { ...draftToConfig(d, MOCK_CARD_CONFIG), merchantId: "demo-sunset-leaf-sf" };
    assert.deepEqual(lintMirror(doc, NOW).errors, []);
  });

  await test("draft: offersFor is who actually gets what", () => {
    assert.deepEqual(offersFor(draft, "first").map((o) => o.id), ["sl-welcome"]);
    assert.deepEqual(offersFor(draft, "no_points").map((o) => o.id), ["sl-welcome"]);
    assert.deepEqual(offersFor(draft, "unknown").map((o) => o.id), ["sl-member"]);
  });

  await test("draft: the licence line and disclosure are managed, and the mirror stamps the line", () => {
    assert.ok(MOCK_CARD_CONFIG.cards.filter(isManagedCard).every((c) => c.type === "disclosure"));
    const { envelope } = resolveConfig({ config: MOCK_CARD_CONFIG, sid: PARITY.sid, now: NOW, surface: "clip", segment: "first", uploadedAt: NOW });
    const offer = envelope.cards.find((c) => c.type === "offer") as { compliance: { licenseLine: string } };
    assert.equal(offer.compliance.licenseLine, MOCK_CARD_CONFIG.compliance?.licenseLine);
    assert.ok(envelope.cards.some((c) => c.type === "disclosure"));
  });

  await test("resolve: offers off, or paused by PapeX, shows nothing", () => {
    const run = (config: CardConfig, state?: { enabled: boolean; revokedCardIds: string[] }) =>
      resolveConfig({ config, sid: PARITY.sid, now: NOW, surface: "web", segment: "first", uploadedAt: NOW, state }).envelope;
    assert.equal(run({ ...MOCK_CARD_CONFIG, enabled: false }).status, "none");
    assert.equal(run(MOCK_CARD_CONFIG, { enabled: false, revokedCardIds: [] }).status, "none");
    assert.ok(!run(MOCK_CARD_CONFIG, { enabled: true, revokedCardIds: ["sl-welcome-web"] }).cards.some((c) => c.id === "sl-welcome-web"));
  });

  // ---- LANGUAGE -------------------------------------------------------------
  await test("language: every issue in the corpus is a sentence, with no path or code in it", () => {
    for (const c of PARITY.cases) {
      for (const issue of [...c.errors, ...c.warnings]) {
        const { text } = describeIssue({ ...issue, message: "" }, c.doc as unknown as CardConfig);
        assert.ok(!/\/offers|\/cards|\/compliance|config_schema|dry_resolve/.test(text), `${c.name}: ${text}`);
        assert.match(text, /[.]$/, `${c.name}: ${text}`);
      }
    }
  });

  await test("language: each field's issue lands on that field and says what's wrong", () => {
    const doc = (name: string) => PARITY.cases.find((c) => c.name === name)!;
    const first = (name: string) => describeIssues(lintMirror(doc(name).doc, NOW).errors, doc(name).doc as unknown as CardConfig)[0];
    assert.deepEqual(first("E empty title"), { offerId: "sl-welcome", field: "title", text: "The offer description can't be empty." });
    assert.equal(first("E long terms").field, "terms");
    assert.match(first("E long terms").text, /501 characters, and the limit is 500/);
    assert.equal(first("E long heading").field, "heading");
    assert.equal(first("E space in code").field, "code");
    assert.match(first("E space in code").text, /no spaces/);
    assert.equal(first("E long qr").field, "code");
    assert.match(first("E long qr").text, /80 characters/);
    assert.equal(first("E days zero").field, "expiry");
    assert.equal(first("E past date").field, "expiry");
    assert.match(first("E past date").text, /already ended/);
    assert.match(first("E no licence").text, /licence line/);
    assert.match(first("E expired licence").text, /expired/);
    assert.match(first("E control char").text, /can't show/);
  });

  await test("language: an unknown code asks for PapeX and doesn't leak a path", () => {
    const { text } = describeIssue({ path: "/secret/path", code: "new_rule", message: "internal words" }, MOCK_CARD_CONFIG);
    assert.match(text, /Contact PapeX/);
    assert.ok(!text.includes("/secret") && !text.includes("internal words"));
  });

  // ---- MOCK -----------------------------------------------------------------
  await test("mock: publishing validates, creates a version, and can roll back", async () => {
    const start = await mockGetCardConfig();
    assert.equal(start.version, 1);
    assert.equal(start.editable, true);

    const bad = fromConfig(start.config!);
    bad.offers[0].template.title = "";
    const refused = await mockPublishCardConfig({ baseVersion: 1, config: toConfigInput(bad), dryRun: false });
    assert.equal(refused.kind, "invalid");
    assert.equal((await mockGetCardConfig()).version, 1, "a refused publish creates nothing");

    const same = await mockPublishCardConfig({ baseVersion: 1, config: toConfigInput(fromConfig(start.config!)), dryRun: false });
    assert.equal(same.kind === "ok" && same.noop, true);

    const good = fromConfig(start.config!);
    good.offers[0].template.valueLabel = "25%";
    const dry = await mockPublishCardConfig({ baseVersion: 1, config: toConfigInput(good), dryRun: true });
    assert.equal(dry.kind === "ok" && dry.dryRun, true);
    assert.equal((await mockGetCardConfig()).version, 1, "a dry run writes nothing");

    const done = await mockPublishCardConfig({ baseVersion: 1, config: toConfigInput(good), dryRun: false });
    assert.equal(done.kind === "ok" && done.version, 2);
    const after = await mockGetCardConfig();
    assert.equal(after.config!.offers["sl-welcome"].valueLabel, "25%");
    assert.deepEqual(after.versions.map((v) => v.version), [2, 1]);

    const stale = await mockPublishCardConfig({ baseVersion: 1, config: toConfigInput(good), dryRun: false });
    assert.equal(stale.kind, "stale");

    const older = await mockGetCardConfig(1);
    const back = await mockPublishCardConfig({ baseVersion: 2, config: toConfigInput(fromConfig(older.config!)), dryRun: false });
    assert.equal(back.kind === "ok" && back.version, 3);
    assert.equal((await mockGetCardConfig()).config!.offers["sl-welcome"].valueLabel, "20%");
  });

  await test("mock: a publish can't change what PapeX manages", async () => {
    const start = await mockGetCardConfig();
    const d = fromConfig(start.config!);
    const input = toConfigInput(d);
    input.cards = input.cards.filter((c) => c.type !== "disclosure");
    input.offers["sl-welcome"].valueLabel = "11%";
    const res = await mockPublishCardConfig({ baseVersion: start.version!, config: input, dryRun: false });
    assert.equal(res.kind, "ok");
    const after = await mockGetCardConfig();
    assert.equal(after.config!.cards.filter((c) => c.type === "disclosure").length, 2);
    assert.equal(after.config!.compliance?.licenseLine, MOCK_CARD_CONFIG.compliance?.licenseLine);
  });

  await test("mock: the preview receipt parses through the real pipeline", async () => {
    const { sid, bytes } = await mockGetPreviewReceiptBytes();
    assert.match(sid, /^[a-f0-9]{16}$/);
    const summary = summarizeReceipt(parseEscPos(bytes).lines);
    assert.equal(summary.merchantName, "SUNSET LEAF CO.");
    assert.equal(summary.total, 64.63);
  });

  console.log(`merchantReceipts: ${passed} tests passed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
