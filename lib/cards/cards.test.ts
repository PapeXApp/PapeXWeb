// lib/cards/cards.test.ts
//
// The cards contract, format v1: schema, fixtures, the client decoder, the
// barcode encoders, the countdown rule and the demo projection.
//
// Run with:
//   npm run test:cards
// Regenerate the demo goldens (contracts/cards/v1/fixtures/demo/) after a
// deliberate change to the demo copy or figures:
//   npx tsx lib/cards/cards.test.ts --update-golden
//
// What each group proves:
//   SCHEMA     the schema compiles, every valid/demo fixture passes it, and the
//              rules that matter (partner-only capture, the loyalty guardrail,
//              https-only links, no bidi controls) are rejected when broken.
//   CLIENT     every client/ fixture decodes to exactly its expected card ids;
//              every valid fixture decodes losslessly.
//   AGREEMENT  the decoder never accepts a card the schema rejects, and never
//              drops one the schema accepts except for its documented extra
//              strictness (check digits, calendar-valid expiry dates) and its
//              list rules (ids, limit).
//   DEMO       the projection matches the goldens, maps each enrichment section
//              to exactly one card type, keeps capture partner-only, and gives
//              the same countdown as offerDaysRemaining on every day of the
//              window.

import assert from "node:assert/strict";
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import Ajv from "ajv";
import {
  barRuns,
  code128Pattern,
  code128Values,
  encodeCode128,
  encodeEan13,
  encodeUpcA,
  gs1CheckDigit,
  isValidEan13,
  isValidUpcA,
} from "./barcode";
import { countdownDays, endOfUtcDayAfter, formatCountdown, parseExpiresAt } from "./countdown";
import { demoResolvedCards, projectDemoEnrichment, DEMO_PARTNER_SIDS } from "./demoSource";
import { normalizeResolvedCards, parseCardsResponse } from "./normalize";
import { buildVariantFiles, testSid, TEST_SID_PREFIX } from "./testVariants";
import { CAPS_1_7_0, CARD_TYPES, MAX_RESPONSE_BYTES, type Card, type ResolvedCards } from "./types";
import { safeHttpsUrl } from "./url";
import { DEMO_RECEIPTS, formatDaysRemaining, getDemoEnrichment, offerDaysRemaining } from "../demoReceipts";

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

// ---- loading the contract -----------------------------------------------------------

const CONTRACT = resolve(__dirname, "../../contracts/cards/v1");
const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));
const listJson = (dir: string) =>
  readdirSync(join(CONTRACT, dir))
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => ({ name: `${dir}/${f}`, path: join(CONTRACT, dir, f) }));

const schema = readJson(join(CONTRACT, "resolved-cards.schema.json")) as object;
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);
const schemaErrors = () => ajv.errorsText(validate.errors);

interface ClientCase {
  description: string;
  requestSid: string;
  response: unknown;
  expect: { cardIds: string[] };
}

const validFixtures = listJson("fixtures/valid");
const clientFixtures = listJson("fixtures/client");

// The demo goldens are projected at the SF Tech Week opening morning.
const GOLDEN_CLOCK = new Date("2026-10-05T17:00:00Z");
const DEMO_GOLDENS: { sid: string; file: string }[] = [
  { sid: "5ca1e00000000001", file: "hartwells.json" },
  { sid: "b0de9a0000000001", file: "ellsworth.json" },
  { sid: "5371e4f000000001", file: "sunset-leaf.json" },
];

function projectDemo(sid: string, now: Date): ResolvedCards {
  const out = demoResolvedCards(sid, { now, offerDaysRemaining: offerDaysRemaining(getDemoEnrichment(sid), now) });
  assert.ok(out, `${sid}: not a demo sid`);
  return out;
}

if (process.argv.includes("--update-golden")) {
  mkdirSync(join(CONTRACT, "fixtures/demo"), { recursive: true });
  for (const { sid, file } of DEMO_GOLDENS) {
    writeFileSync(join(CONTRACT, "fixtures/demo", file), JSON.stringify(projectDemo(sid, GOLDEN_CLOCK), null, 2) + "\n");
    console.log(`  wrote fixtures/demo/${file}`);
  }
}

const demoFixtures = listJson("fixtures/demo");

// v1.1 variants: generated from lib/cards/testVariants.ts, committed as JSON.
const VARIANT_FILES = buildVariantFiles().files;
if (process.argv.includes("--update-variants")) {
  for (const [rel, value] of Object.entries(VARIANT_FILES)) {
    const path = join(CONTRACT, rel);
    mkdirSync(resolve(path, ".."), { recursive: true });
    writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
  }
  console.log(`  wrote ${Object.keys(VARIANT_FILES).length} variant/config files`);
}
const configSchema = readJson(join(CONTRACT, "merchant-config.schema.json")) as object;
const validateConfig = new Ajv({ allErrors: true }).compile(configSchema);

/** A minimal valid envelope around some cards, for probing the schema one rule at a time. */
function envelope(cards: unknown[], merchant = { partner: false, ageRestricted: false }, extra: object = {}) {
  return { schemaVersion: 1, sid: "c0ffee0000000001", status: "ok", merchant, cards, ...extra };
}
const text = (extra: object = {}) => ({ id: "t", type: "text", mode: "live", voice: "papex", body: "Hello.", ...extra });
const capture = (extra: object = {}) => ({
  id: "cap",
  type: "emailCapture",
  mode: "preview",
  consentLabel: "Share my email with Example Market.",
  consent: { textId: "example", textVersion: 1 },
  ...extra,
});

// =============================================================================
// SCHEMA
// =============================================================================

test("schema: compiles as draft-07", () => {
  assert.equal(typeof validate, "function");
  assert.equal((schema as { $schema: string }).$schema, "http://json-schema.org/draft-07/schema#");
});

test("schema: lists exactly the TS card types", () => {
  const defs = (schema as { definitions: { card: { properties: { type: { enum: string[] } } } } }).definitions;
  assert.deepEqual([...defs.card.properties.type.enum].sort(), [...CARD_TYPES].sort());
});

test("schema: every valid/ and demo/ fixture validates", () => {
  for (const f of [...validFixtures, ...demoFixtures]) {
    assert.ok(validate(readJson(f.path)), `${f.name}: ${schemaErrors()}`);
  }
});

test("schema: the valid fixtures cover every v1 card type, redemption and status", () => {
  const types = new Set<string>();
  const redemptions = new Set<string>();
  const statuses = new Set<string>();
  for (const f of validFixtures) {
    const r = readJson(f.path) as ResolvedCards;
    statuses.add(r.status);
    for (const c of r.cards) {
      types.add(c.type);
      if (c.type === "offer" && c.redemption) {
        redemptions.add(c.redemption.type === "barcode" ? `barcode:${c.redemption.symbology}` : c.redemption.type);
      }
    }
  }
  assert.deepEqual([...types].sort(), [...CARD_TYPES].sort());
  assert.deepEqual([...redemptions].sort(), ["barcode:code128", "barcode:ean13", "barcode:upca", "code"]);
  assert.deepEqual([...statuses].sort(), ["degraded", "none", "ok", "pending"]);
});

test("schema: PARTNER-ONLY, an emailCapture card with partner false is invalid", () => {
  assert.equal(validate(envelope([capture()])), false);
  assert.ok(validate(envelope([capture()], { partner: true, ageRestricted: false })), schemaErrors());
});

test("schema: an age-restricted merchant's capture card needs an age affirmation", () => {
  const m = { partner: true, ageRestricted: true };
  assert.equal(validate(envelope([capture()], m)), false);
  assert.ok(validate(envelope([capture({ ageAffirmationLabel: "I am 21 or older." })], m)), schemaErrors());
});

test("schema: a live capture card needs its email field; a pre-checked box cannot be expressed", () => {
  const m = { partner: true, ageRestricted: false };
  assert.equal(validate(envelope([capture({ mode: "live" })], m)), false);
  assert.ok(validate(envelope([capture({ mode: "live", input: { placeholder: "you@example.com", submitLabel: "Join" } })], m)));
  assert.equal(validate(envelope([capture({ checked: true })], m)), false);
  assert.equal(validate(envelope([capture({ defaultChecked: true })], m)), false);
});

test("schema: the loyalty guardrail note is required", () => {
  const loyalty = { id: "l", type: "loyalty", mode: "live", programName: "Rewards" };
  assert.equal(validate(envelope([loyalty])), false);
  assert.ok(validate(envelope([{ ...loyalty, note: "PapeX tracks your points." }])), schemaErrors());
});

test("schema: CTA URLs must be https with a dotted host, no userinfo, no port", () => {
  const cta = (url: string) => ({ id: "c", type: "cta", mode: "live", voice: "papex", label: "Go", url, style: "primary" });
  assert.ok(validate(envelope([cta("https://order.example.com/x?y=1#z")])), schemaErrors());
  for (const bad of [
    "http://example.com/",
    "javascript:alert(1)",
    "data:text/html,hi",
    "https://user@example.com/",
    "https://example.com:8443/",
    "https://localhost/",
    "https://example.com/a b",
    "https://example.com/\"onmouseover=x",
    "//example.com/",
  ]) {
    assert.equal(validate(envelope([cta(bad)])), false, bad);
  }
});

test("schema: text rejects controls, bidi overrides, blank strings and over-long strings", () => {
  for (const body of ["a\u202Eb", "a\u2066b", "a\nb", "a\u0000b", "a\u2028b", "   ", "", "x".repeat(501)]) {
    assert.equal(validate(envelope([text({ body })])), false, JSON.stringify(body));
  }
  assert.ok(validate(envelope([text({ body: "👨‍👩‍👧 <b>fine</b> {{not a template}}" })])), schemaErrors());
});

test("schema: none/degraded carry no cards; retryAfterMs only with pending; unknown types are invalid", () => {
  assert.equal(validate(envelope([text()], undefined, { status: "none" })), false);
  assert.equal(validate(envelope([], undefined, { retryAfterMs: 1000 })), false);
  assert.ok(validate(envelope([], undefined, { status: "pending", retryAfterMs: 1000 })), schemaErrors());
  assert.equal(validate(envelope([{ id: "p", type: "poll", mode: "live" }])), false);
  assert.equal(validate(envelope([text()], undefined, { schemaVersion: 2 })), false);
});

test("schema: barcode values are constrained per symbology", () => {
  const offer = (redemption: object) => ({ id: "o", type: "offer", mode: "live", valueLabel: "$1", title: "$1 off.", redemption });
  assert.ok(validate(envelope([offer({ type: "barcode", symbology: "code128", value: "A".repeat(24) })])));
  assert.equal(validate(envelope([offer({ type: "barcode", symbology: "code128", value: "A".repeat(25) })])), false);
  assert.equal(validate(envelope([offer({ type: "barcode", symbology: "ean13", value: "123" })])), false);
  // v1.1: qr is a known symbology (<= 80 printable ASCII); pdf417 is still not.
  assert.ok(validate(envelope([offer({ type: "barcode", symbology: "qr", value: "x" })])), schemaErrors());
  assert.ok(validate(envelope([offer({ type: "barcode", symbology: "qr", value: "Q".repeat(80) })])), schemaErrors());
  assert.equal(validate(envelope([offer({ type: "barcode", symbology: "qr", value: "Q".repeat(81) })])), false);
  assert.equal(validate(envelope([offer({ type: "barcode", symbology: "pdf417", value: "x" })])), false);
});

// =============================================================================
// CLIENT (the decoder)
// =============================================================================

test("client: every client/ fixture decodes to exactly its expected card ids", () => {
  for (const f of clientFixtures) {
    const c = readJson(f.path) as ClientCase;
    assert.ok(c.description && c.requestSid && c.expect && Array.isArray(c.expect.cardIds), `${f.name}: malformed case`);
    const out = normalizeResolvedCards(c.response, c.requestSid);
    assert.deepEqual(
      out.cards.map((card) => card.id),
      c.expect.cardIds,
      `${f.name}: ${JSON.stringify(out.dropped)} ${out.rejected ?? ""}`,
    );
  }
});

test("client: every valid/ and demo/ fixture decodes losslessly", () => {
  for (const f of [...validFixtures, ...demoFixtures]) {
    const r = readJson(f.path) as ResolvedCards;
    const out = normalizeResolvedCards(r, r.sid);
    assert.deepEqual(out.dropped, [], `${f.name}: dropped ${JSON.stringify(out.dropped)}`);
    assert.equal(out.rejected, undefined, `${f.name}: rejected ${out.rejected}`);
    assert.deepEqual(out.cards, r.status === "none" || r.status === "degraded" ? [] : r.cards, f.name);
  }
});

test("client: never throws, whatever it is handed", () => {
  const hostile: unknown[] = [
    undefined,
    null,
    "",
    "{}",
    42,
    [],
    { schemaVersion: 1 },
    { schemaVersion: 1, sid: "c0ffee0000000001", status: "ok", merchant: { partner: true, ageRestricted: false }, cards: [null, [], "x", { type: "offer" }] },
    Object.create(null),
    new Proxy({}, { get: () => { throw new Error("boom"); } }),
  ];
  for (const h of hostile) {
    const out = normalizeResolvedCards(h, "c0ffee0000000001");
    assert.ok(Array.isArray(out.cards));
  }
});

test("client: a hostile __proto__ key cannot pollute Object.prototype", () => {
  const raw = JSON.parse(
    '{"schemaVersion":1,"sid":"c0ffee0000000001","status":"ok","merchant":{"partner":false,"ageRestricted":false},' +
      '"cards":[{"id":"a","type":"text","mode":"live","voice":"papex","body":"x","__proto__":{"polluted":true}}]}',
  );
  const out = normalizeResolvedCards(raw, "c0ffee0000000001");
  assert.equal(out.cards.length, 1);
  assert.equal(({} as Record<string, unknown>).polluted, undefined);
  assert.equal(Object.prototype.hasOwnProperty.call(out.cards[0], "__proto__"), false);
});

test("client: PARTNER-ONLY, capture survives only for merchant.partner === true", () => {
  const sid = "c0ffee0000000001";
  assert.equal(normalizeResolvedCards(envelope([capture()]), sid).cards.length, 0);
  assert.equal(normalizeResolvedCards(envelope([capture()], { partner: true, ageRestricted: false }), sid).cards.length, 1);
  // A merchant object that fails to say "partner" as a boolean fails the whole envelope.
  assert.equal(
    normalizeResolvedCards(envelope([capture()], { partner: 1, ageRestricted: false } as never), sid).rejected,
    "bad merchant",
  );
});

// =============================================================================
// AGREEMENT between the decoder and the schema
// =============================================================================

test("agreement: the decoder never accepts what the schema rejects, nor rejects what it accepts", () => {
  const LIST_RULES = new Set(["unknown type", "duplicate id", "over the card limit"]);
  for (const f of clientFixtures) {
    const c = readJson(f.path) as ClientCase;
    const out = normalizeResolvedCards(c.response, c.requestSid);
    if (out.rejected || out.status === "none") continue;
    const response = c.response as { merchant: { partner: boolean; ageRestricted: boolean }; cards: unknown[] };
    // Accepted cards, re-wrapped as a response, are schema-valid.
    assert.ok(validate(envelope(out.cards, response.merchant)), `${f.name}: accepted cards fail the schema: ${schemaErrors()}`);
    // Each card the decoder dropped on its merits, alone in an envelope, fails the schema too,
    // except the decoder's one documented extra check (GS1 check digits).
    for (const d of out.dropped) {
      // The decoder's documented extra strictness, beyond what JSON Schema can say:
      // GS1 check digits, and calendar-valid expiresAt (the schema's pattern
      // admits 2026-02-30; Date round-tripping does not).
      if (LIST_RULES.has(d.reason) || d.id === "bad-check-digit" || d.id === "bad-expiry") continue;
      const lone = response.cards[d.index];
      assert.equal(validate(envelope([lone], response.merchant)), false, `${f.name}: schema accepts dropped card ${d.id} (${d.reason})`);
    }
  }
});

// =============================================================================
// v1.1 (1.7.0): layout, scope, qr, compliance, headline, hideWhenExpired, size
// =============================================================================

const SID1 = "c0ffee0000000001";
const offerV11 = (extra: object = {}) => ({ id: "o", type: "offer", mode: "live", valueLabel: "$5", title: "$5 off.", ...extra });
const LICENCE = { licenseLine: "CA cannabis retailer licence LICENSE_PLACEHOLDER" };
const AGE = { partner: false, ageRestricted: true };
const ids = (out: { cards: Card[] }) => out.cards.map((c) => c.id);

test("v1.1 schema: layout, scope, hideWhenExpired, compliance and headline are accepted when well-formed", () => {
  assert.ok(validate(envelope([text()], undefined, { layout: { order: "cards-first" } })), schemaErrors());
  assert.ok(validate(envelope([text()], undefined, { layout: { order: "receipt-first" } })), schemaErrors());
  assert.equal(validate(envelope([text()], undefined, { layout: { order: "coupons-first" } })), false);
  assert.equal(validate(envelope([text()], undefined, { layout: {} })), false);
  for (const scope of ["shared", "unique"]) {
    assert.ok(validate(envelope([offerV11({ redemption: { type: "code", code: "X1", scope } })])), schemaErrors());
    assert.ok(validate(envelope([offerV11({ redemption: { type: "barcode", symbology: "code128", value: "X1", scope } })])), schemaErrors());
  }
  assert.equal(validate(envelope([offerV11({ redemption: { type: "code", code: "X1", scope: "mine" } })])), false);
  assert.ok(validate(envelope([offerV11({ validity: { expiresAt: "2026-11-01T06:59:59Z", countdown: true, hideWhenExpired: true } })])), schemaErrors());
  assert.ok(validate(envelope([offerV11({ compliance: LICENCE })])), schemaErrors());
  assert.equal(validate(envelope([offerV11({ compliance: { licenseLine: "L".repeat(121) } })])), false);
  const savings = { id: "s", type: "savings", mode: "live", total: "$4.00", totalLabel: "saved" };
  assert.ok(validate(envelope([{ ...savings, headline: "You saved $4.00 with a PapeX coupon" }])), schemaErrors());
  assert.equal(validate(envelope([{ ...savings, headline: "S".repeat(61) }])), false);
});

test("v1.1 schema: an age-restricted merchant's offers and merchant-voice text/cta need a licence line", () => {
  assert.equal(validate(envelope([offerV11()], AGE)), false);
  assert.ok(validate(envelope([offerV11({ compliance: LICENCE })], AGE)), schemaErrors());
  assert.equal(validate(envelope([text({ voice: "merchant" })], AGE)), false);
  assert.ok(validate(envelope([text({ voice: "merchant", compliance: LICENCE })], AGE)), schemaErrors());
  assert.ok(validate(envelope([text({ voice: "papex" })], AGE)), schemaErrors());
  const cta = { id: "c", type: "cta", mode: "live", voice: "merchant", label: "Go", url: "https://papex.app/", style: "primary" };
  assert.equal(validate(envelope([cta], AGE)), false);
  assert.ok(validate(envelope([{ ...cta, compliance: LICENCE }], AGE)), schemaErrors());
  // Not age-restricted: optional.
  assert.ok(validate(envelope([offerV11(), text({ voice: "merchant" }), cta])), schemaErrors());
});

test("v1.1 client: layout.order degrades to receipt-first and never costs a card", () => {
  const order = (layout: unknown) => normalizeResolvedCards(envelope([text()], undefined, layout === undefined ? {} : { layout }), SID1);
  assert.equal(order({ order: "cards-first" }).layout.order, "cards-first");
  assert.equal(order({ order: "receipt-first" }).layout.order, "receipt-first");
  for (const bad of [undefined, null, "cards-first", 7, [], {}, { order: "CARDS-FIRST" }, { order: "coupons-first" }, { order: null }]) {
    const out = order(bad);
    assert.equal(out.layout.order, "receipt-first", JSON.stringify(bad));
    assert.deepEqual(ids(out), ["t"], JSON.stringify(bad));
  }
  // A rejected envelope still reports a layout.
  assert.equal(normalizeResolvedCards(undefined, SID1).layout.order, "receipt-first");
});

test("v1.1 client: redemption.scope is a hint; unknown is dropped from the card, never the card", () => {
  const out = normalizeResolvedCards(
    envelope([
      offerV11({ id: "a", redemption: { type: "code", code: "X1", scope: "unique" } }),
      offerV11({ id: "b", redemption: { type: "barcode", symbology: "code128", value: "X1", scope: "shared" } }),
      offerV11({ id: "c", redemption: { type: "code", code: "X1", scope: "perCustomer" } }),
      offerV11({ id: "d", redemption: { type: "code", code: "X1", scope: 1 } }),
    ]),
    SID1,
  );
  assert.deepEqual(ids(out), ["a", "b", "c", "d"]);
  const scopes = out.cards.map((c) => (c.type === "offer" ? c.redemption?.scope : undefined));
  assert.deepEqual(scopes, ["unique", "shared", undefined, undefined]);
});

test("v1.1 client: qr values are 1-80 printable ASCII", () => {
  const qr = (id: string, value: unknown) => offerV11({ id, redemption: { type: "barcode", symbology: "qr", value } });
  const out = normalizeResolvedCards(
    envelope([qr("ok", "https://papex.app/x?y=1"), qr("max", "Q".repeat(80)), qr("long", "Q".repeat(81)), qr("nl", "A\nB"), qr("empty", ""), qr("num", 5), qr("utf", "café")]),
    SID1,
  );
  assert.deepEqual(ids(out), ["ok", "max"]);
});

test("v1.1 client: compliance fails closed", () => {
  const cta = (extra: object = {}) => ({ id: "cta", type: "cta", mode: "live", voice: "merchant", label: "Go", url: "https://papex.app/", style: "primary", ...extra });
  const cards = [
    offerV11({ id: "offer-ok", compliance: LICENCE }),
    offerV11({ id: "offer-missing" }),
    offerV11({ id: "offer-null", compliance: null }),
    offerV11({ id: "offer-bad-type", compliance: "C10-1" }),
    offerV11({ id: "offer-empty", compliance: {} }),
    offerV11({ id: "offer-bidi", compliance: { licenseLine: "Lic \u202E1" } }),
    text({ id: "mtext-ok", voice: "merchant", compliance: LICENCE }),
    text({ id: "mtext-missing", voice: "merchant" }),
    text({ id: "ptext", voice: "papex" }),
    cta({ id: "cta-ok", compliance: LICENCE }),
    cta({ id: "cta-missing" }),
    cta({ id: "pcta", voice: "papex" }),
  ];
  assert.deepEqual(ids(normalizeResolvedCards(envelope(cards, AGE), SID1)), ["offer-ok", "mtext-ok", "ptext", "cta-ok", "pcta"]);
  // Not age-restricted: a missing licence is fine; a MALFORMED one still drops its card.
  // (Two envelopes: one would hit the 8-card limit.)
  assert.deepEqual(ids(normalizeResolvedCards(envelope(cards.slice(0, 6)), SID1)), ["offer-ok", "offer-missing", "offer-null"]);
  assert.deepEqual(ids(normalizeResolvedCards(envelope(cards.slice(6)), SID1)), ["mtext-ok", "mtext-missing", "ptext", "cta-ok", "cta-missing", "pcta"]);
  const kept = normalizeResolvedCards(envelope([offerV11({ compliance: LICENCE })], AGE), SID1).cards[0];
  assert.deepEqual(kept.type === "offer" && kept.compliance, LICENCE);
});

test("v1.1 client: savings headline is optional, at most 60 code points", () => {
  const s = (id: string, headline: unknown) => ({ id, type: "savings", mode: "live", total: "$4.00", totalLabel: "saved", headline });
  const out = normalizeResolvedCards(envelope([s("a", "You saved $4.00 with a PapeX coupon"), s("b", null), s("c", "S".repeat(61)), s("d", "  ")]), SID1);
  assert.deepEqual(ids(out), ["a", "b"]);
});

test("v1.1 client: hideWhenExpired hides an expired offer only when a clock is given", () => {
  const v = (hide: unknown) => ({ expiresAt: "2026-11-01T06:59:59Z", countdown: true, hideWhenExpired: hide });
  const cards = [offerV11({ id: "hide", validity: v(true) }), offerV11({ id: "keep", validity: v(false) }), offerV11({ id: "absent", validity: v(null) })];
  assert.deepEqual(ids(normalizeResolvedCards(envelope(cards), SID1)), ["hide", "keep", "absent"]);
  assert.deepEqual(ids(normalizeResolvedCards(envelope(cards), SID1, { now: new Date("2026-11-01T06:59:59.999Z") })), ["hide", "keep", "absent"]);
  assert.deepEqual(ids(normalizeResolvedCards(envelope(cards), SID1, { now: new Date("2026-11-01T07:00:00Z") })), ["keep", "absent"]);
  assert.deepEqual(ids(normalizeResolvedCards(envelope(cards), SID1, { now: new Date(NaN) })), ["hide", "keep", "absent"]);
  assert.deepEqual(ids(normalizeResolvedCards(envelope([offerV11({ validity: v("yes") })]), SID1)), []);
});

test("v1.1 client: parseCardsResponse caps the body, rejects non-JSON, never throws", () => {
  const good = JSON.stringify(envelope([text()]));
  assert.deepEqual(ids(parseCardsResponse(good, SID1)), ["t"]);
  const pad = (n: number) => {
    const base = JSON.stringify(envelope([text()])).slice(0, -1);
    return base + `,"pad":"${"x".repeat(n - base.length - 10)}"}`;
  };
  assert.equal(new TextEncoder().encode(pad(MAX_RESPONSE_BYTES)).length, MAX_RESPONSE_BYTES);
  assert.deepEqual(ids(parseCardsResponse(pad(MAX_RESPONSE_BYTES), SID1)), ["t"]);
  assert.equal(parseCardsResponse(pad(MAX_RESPONSE_BYTES + 1), SID1).rejected, "oversize");
  // Multi-byte text over the cap in UTF-8 but not in UTF-16 code units.
  const wide = JSON.stringify(envelope([text({ body: "é".repeat(400) })]));
  const wideBody = wide.slice(0, -1) + `,"pad":"${"é".repeat(17_000)}"}`;
  assert.ok(wideBody.length < MAX_RESPONSE_BYTES * 1.1 && new TextEncoder().encode(wideBody).length > MAX_RESPONSE_BYTES);
  assert.equal(parseCardsResponse(wideBody, SID1).rejected, "oversize");
  for (const bad of ["", "{", "null", "<html>", undefined, 42, Buffer.from(good)]) {
    const out = parseCardsResponse(bad, SID1);
    assert.deepEqual(out.cards, [], String(bad));
    assert.equal(out.layout.order, "receipt-first");
  }
  assert.equal(parseCardsResponse("{", SID1).rejected, "not json");
});

test("v1.1 caps: each 1.7.0 surface's token list is exactly what the contract says", () => {
  assert.deepEqual(CAPS_1_7_0.web.includes("barcode.qr" as never), false, "web has no QR encoder yet");
  assert.ok(CAPS_1_7_0.clip.includes("barcode.qr") && CAPS_1_7_0.app.includes("barcode.qr"));
  assert.ok(CAPS_1_7_0.app.includes("save") && !CAPS_1_7_0.clip.includes("save" as never) && !CAPS_1_7_0.web.includes("save" as never));
  for (const s of ["web", "clip", "app"] as const) {
    assert.ok(CAPS_1_7_0[s].includes("compliance"), s);
    for (const t of CAPS_1_7_0[s]) assert.ok(!["emailCapture", "insight", "loyalty"].includes(t), `${s}: ${t}`);
  }
});

// =============================================================================
// VARIANTS (fixtures/variants, INDEX.json) and CONFIG (merchant-config.schema.json)
// =============================================================================

interface VariantIndex {
  capsBySurface: Record<string, string>;
  variants: {
    sid: string;
    variant: string;
    merchantId: string;
    copyReceiptBlobFrom: string;
    layout: string;
    status: string;
    responses: Record<"web" | "clip" | "app", string>;
    expectCardIds: Record<"web" | "clip" | "app", string[]>;
    mustNotAppear?: string[];
  }[];
  clientOnly: { file: string; requestSid: string; now: string | null; expectCardIds: string[]; expectCardIdsWithoutClock?: string[]; expectLayout?: string }[];
}
const VARIANT_DIR = join(CONTRACT, "fixtures/variants");
const variantIndex = () => readJson(join(VARIANT_DIR, "INDEX.json")) as VariantIndex;

test("variants: the committed files are exactly what lib/cards/testVariants.ts generates", () => {
  for (const [rel, value] of Object.entries(VARIANT_FILES)) {
    assert.equal(readFileSync(join(CONTRACT, rel), "utf8"), JSON.stringify(value, null, 2) + "\n", `${rel} is stale: run --update-variants`);
  }
  const onDisk = readdirSync(VARIANT_DIR).map((f) => `fixtures/variants/${f}`).sort();
  const generated = Object.keys(VARIANT_FILES).filter((k) => k.startsWith("fixtures/variants/")).sort();
  assert.deepEqual(onDisk, generated, "stray or missing files in fixtures/variants");
});

test("variants: INDEX sids are 7e57ca4d0000NNNN from 0001, contiguous, test merchants only, never a demo sid", () => {
  const idx = variantIndex();
  idx.variants.forEach((v, i) => {
    assert.equal(v.sid, testSid(i + 1));
    assert.ok(v.sid.startsWith(TEST_SID_PREFIX) && /^[a-f0-9]{16}$/.test(v.sid));
    assert.ok(v.merchantId === "test-cards" || v.merchantId === "test-cards-21", v.merchantId);
    assert.ok(!DEMO_RECEIPTS.has(v.sid));
    assert.ok(["5ca1e00000000001", "b0de9a0000000001"].includes(v.copyReceiptBlobFrom));
  });
  assert.equal(new Set(idx.variants.map((v) => v.variant)).size, idx.variants.length);
  for (const s of ["web", "clip", "app"] as const) assert.equal(idx.capsBySurface[s], CAPS_1_7_0[s].join(","));
});

test("variants: every minted response is schema-valid, decodes losslessly, and matches INDEX", () => {
  const idx = variantIndex();
  const SURF = ["web", "clip", "app"] as const;
  for (const v of idx.variants) {
    for (const s of SURF) {
      const r = readJson(join(VARIANT_DIR, v.responses[s])) as ResolvedCards;
      const where = `${v.variant}/${s}`;
      assert.ok(validate(r), `${where}: ${schemaErrors()}`);
      assert.equal(r.sid, v.sid, where);
      // Decoded at a clock inside the test window, every card survives.
      const out = normalizeResolvedCards(r, v.sid, { now: new Date("2026-10-05T17:00:00Z") });
      assert.deepEqual(out.dropped, [], `${where}: ${JSON.stringify(out.dropped)}`);
      assert.deepEqual(ids(out), v.expectCardIds[s], where);
      if (r.status === "ok" || r.status === "pending") {
        assert.deepEqual(out.cards, r.cards, `${where}: not lossless`);
        assert.equal(out.layout.order, v.layout, where);
        assert.ok(r.cards.length <= 6, `${where}: over the 1.7.0 resolver cap`);
      }
      for (const gone of v.mustNotAppear ?? []) assert.ok(!r.cards.some((c) => c.id === gone), `${where}: ${gone}`);
      // Audience segregation: when the app gets its own cards, no id is shared with web/clip.
      if (s === "app" && v.responses.app !== v.responses.clip) {
        for (const id of v.expectCardIds.app) assert.ok(![...v.expectCardIds.web, ...v.expectCardIds.clip].includes(id), `${where}: ${id} shared`);
      }
      for (const c of r.cards) {
        if (c.type === "offer" && c.actions?.length) assert.equal(s, "app", `${where}: save outside the app`);
        if (c.type === "offer" && c.redemption?.type === "barcode") {
          assert.ok(CAPS_1_7_0[s].includes(`barcode.${c.redemption.symbology}` as never), `${where}: ${c.redemption.symbology} not in ${s} caps`);
        }
        if (r.merchant.ageRestricted && (c.type === "offer" || ((c.type === "text" || c.type === "cta") && c.voice === "merchant"))) {
          assert.ok(c.compliance?.licenseLine.includes("LICENSE_PLACEHOLDER"), `${where}: ${c.id} lacks the licence line`);
        }
      }
    }
  }
});

test("variants: the set covers every 1.7.0 axis", () => {
  const idx = variantIndex();
  const seen = new Set<string>();
  for (const v of idx.variants) {
    seen.add(`layout:${v.layout}`);
    seen.add(`status:${v.status}`);
    for (const s of ["web", "clip", "app"] as const) {
      const r = readJson(join(VARIANT_DIR, v.responses[s])) as ResolvedCards;
      if (r.cards.length >= 4) seen.add("four-cards");
      if (r.cards.length === 1 && r.cards[0].type === "text") seen.add("text-only");
      for (const c of r.cards) {
        seen.add(`type:${c.type}`);
        if (c.type === "offer") {
          if (c.redemption?.type === "barcode") seen.add(`barcode:${c.redemption.symbology}`);
          if (c.redemption?.type === "code") seen.add("code-only");
          if (c.redemption?.scope) seen.add(`scope:${c.redemption.scope}`);
          seen.add(c.compliance ? "licence:on" : "licence:off");
          if (c.actions?.length) seen.add("save:app");
        }
        if (c.type === "savings" && c.headline) seen.add("savings:headline");
      }
    }
    if (v.mustNotAppear?.length) seen.add("expired-dropped");
    if (v.expectCardIds.app.join() !== v.expectCardIds.clip.join() && v.variant === "audience") seen.add("audience");
  }
  for (const want of [
    "layout:receipt-first", "layout:cards-first", "status:ok", "status:none", "status:degraded", "status:pending",
    "barcode:code128", "barcode:qr", "barcode:upca", "code-only", "scope:shared", "scope:unique",
    "licence:on", "licence:off", "savings:headline", "type:text", "type:cta", "type:savings", "type:offer",
    "four-cards", "text-only", "expired-dropped", "audience", "save:app",
  ]) {
    assert.ok(seen.has(want), `no variant covers ${want}`);
  }
});

test("variants: client-only cases decode to exactly their expected ids", () => {
  for (const c of variantIndex().clientOnly) {
    const r = readJson(join(VARIANT_DIR, c.file));
    const out = normalizeResolvedCards(r, c.requestSid, c.now ? { now: new Date(c.now) } : {});
    assert.deepEqual(ids(out), c.expectCardIds, `${c.file}: ${JSON.stringify(out.dropped)}`);
    if (c.expectLayout) assert.equal(out.layout.order, c.expectLayout);
    if (c.expectCardIdsWithoutClock) assert.deepEqual(ids(normalizeResolvedCards(r, c.requestSid)), c.expectCardIdsWithoutClock);
  }
  // hostile.json is NOT schema-valid (the server can never send it) ...
  const hostileJson = readJson(join(VARIANT_DIR, "hostile.json"));
  assert.equal(validate(hostileJson), false);
  // ... and every card the decoder dropped on its merits is schema-invalid alone too.
  const out = normalizeResolvedCards(hostileJson, "7e57ca4d0000ff01");
  const h = hostileJson as { merchant: object; cards: unknown[] };
  for (const d of out.dropped) {
    if (["unknown type", "duplicate id"].includes(d.reason) || d.id === "bad-upca") continue;
    assert.equal(validate(envelope([h.cards[d.index]], h.merchant as never)), false, `schema accepts ${d.id} (${d.reason})`);
  }
  const ok = out.cards.find((c) => c.id === "ok-offer");
  assert.ok(ok && ok.type === "offer" && ok.redemption && ok.redemption.scope === undefined, "unknown scope must be stripped");
  // expiry-at-render.json IS schema-valid.
  assert.ok(validate(readJson(join(VARIANT_DIR, "expiry-at-render.json"))), schemaErrors());
});

test("config: the two test-merchant configs are schema-valid", () => {
  for (const f of ["test-cards.json", "test-cards-21.json"]) {
    assert.ok(validateConfig(readJson(join(CONTRACT, "config-examples", f))), `${f}: ${JSON.stringify(validateConfig.errors)}`);
  }
});

test("config: the schema enforces L1 audiences, L2 save, L3 licence, L4 1.7.0 types, L7 debug, L11 expiry", () => {
  const base = readJson(join(CONTRACT, "config-examples/test-cards.json")) as Record<string, unknown> & { cards: Record<string, unknown>[]; merchant: Record<string, unknown> };
  const withCard = (card: object) => ({ ...base, cards: [card] });
  const offerCard = (extra: object = {}) => ({ id: "x", surfaces: ["web", "clip"], type: "offer", offer: "h-bounty-code128", ...extra });
  assert.ok(validateConfig(withCard(offerCard())), JSON.stringify(validateConfig.errors));
  // L1
  assert.equal(validateConfig(withCard(offerCard({ surfaces: ["app", "web"] }))), false);
  assert.equal(validateConfig(withCard(offerCard({ surfaces: ["app", "clip"] }))), false);
  assert.ok(validateConfig(withCard(offerCard({ surfaces: ["app", "preview"] }))));
  // L2
  const save = { actions: [{ type: "save", label: "Save to PapeX" }] };
  assert.equal(validateConfig(withCard(offerCard(save))), false);
  assert.ok(validateConfig(withCard(offerCard({ ...save, surfaces: ["app"] }))), JSON.stringify(validateConfig.errors));
  // L3
  const noLicence = { ...base, merchant: { ...base.merchant, ageRestricted: true } };
  assert.equal(validateConfig(noLicence), false);
  assert.ok(validateConfig({ ...noLicence, merchant: { ...noLicence.merchant, licenseLine: "CA licence LICENSE_PLACEHOLDER" } }));
  // L4
  for (const type of ["emailCapture", "insight", "loyalty", "poll"]) assert.equal(validateConfig(withCard({ id: "x", surfaces: ["web"], type })), false, type);
  // L7
  const debug = { forceStatus: [{ sids: [testSid(18)], status: "degraded" }] };
  assert.ok(validateConfig({ ...base, debug }));
  assert.equal(validateConfig({ ...base, merchantId: "doobie-nights", debug }), false);
  assert.equal(validateConfig({ ...base, merchant: { ...base.merchant, test: false }, debug }), false);
  // L11 + code modes
  const offers = base.offers as Record<string, Record<string, unknown>>;
  const tpl = offers["h-bounty-code128"];
  const withOffer = (o: object) => ({ ...base, offers: { ...offers, t: { ...tpl, ...o } } });
  assert.equal(validateConfig(withOffer({ validity: { expiresOn: "2026-10-31", validForDays: 14, countdown: true } })), false);
  assert.equal(validateConfig(withOffer({ validity: { countdown: true } })), false);
  assert.ok(validateConfig(withOffer({ validity: { validForDays: 14, countdown: true } })));
  const red = (code: object) => withOffer({ redemption: { type: "barcode", symbology: "code128", code } });
  assert.ok(validateConfig(red({ mode: "perSid", pool: "p1" })));
  assert.ok(validateConfig(red({ mode: "template", template: "DN-{sid6}" })));
  assert.equal(validateConfig(red({ mode: "template", template: "DN-{sid}" })), false);
  assert.equal(validateConfig(red({ mode: "template", template: "DN-{receipt.total}" })), false);
  assert.equal(validateConfig(red({ mode: "random" })), false);
  // Rules: only the v1 facts.
  const rule = (when: object) => withCard(offerCard({ when }));
  assert.ok(validateConfig(rule({ all: [{ fact: "device.id", op: "in", value: ["rdh-pilot-01"] }, { fact: "now", op: "between", value: ["2026-10-01T00:00:00Z", "2026-11-01T00:00:00Z"] }] })));
  assert.ok(validateConfig(rule({ not: { fact: "request.surface", op: "in", value: ["web"] } })));
  assert.equal(validateConfig(rule({ fact: "receipt.total", op: "gte", value: 10000 })), false);
  assert.equal(validateConfig(rule({ fact: "device.id", op: "eq", value: "rdh-pilot-01" })), false);
});

// =============================================================================
// URL, COUNTDOWN, BARCODES
// =============================================================================

test("url: an allowlist of one shape", () => {
  assert.equal(safeHttpsUrl("https://papex.app/menu?x=1#y"), "https://papex.app/menu?x=1#y");
  assert.equal(safeHttpsUrl("https://xn--bcher-kva.example/"), "https://xn--bcher-kva.example/");
  for (const bad of [
    "http://papex.app",
    "HTTPS://papex.app",
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,x",
    "vbscript:x",
    "https://user:pw@papex.app",
    "https://papex.app@evil.example",
    "https://papex.app:444/",
    "https://-evil.example/",
    "https://papex/",
    " https://papex.app",
    "https://papex.app/\\evil",
    "https://papex.app/\"><script>",
    "https://papex.app/" + "a".repeat(2048),
    42,
    null,
  ]) {
    assert.equal(safeHttpsUrl(bad), null, String(bad));
  }
});

test("countdown: expiresAt is exactly second-precision UTC and a real date", () => {
  assert.equal(parseExpiresAt("2026-10-20T23:59:59Z"), Date.UTC(2026, 9, 20, 23, 59, 59) / 1000);
  for (const bad of ["2026-02-30T23:59:59Z", "2026-10-20T23:59:59.000Z", "2026-10-20T23:59:59+00:00", "2026-10-20", "2026-10-20T24:00:00Z"]) {
    assert.equal(parseExpiresAt(bad), null, bad);
  }
});

test("countdown: counts the merchant's calendar days from a merchant-tz expiresAt", () => {
  // Valid through Tue 2026-09-22 in Los Angeles (PDT, UTC-7).
  const exp = "2026-09-23T06:59:59Z";
  assert.equal(countdownDays(exp, new Date("2026-09-22T17:00:00Z")), 0); // Tue 10:00 LA: last day
  assert.equal(countdownDays(exp, new Date("2026-09-23T06:59:59Z")), 0); // Tue 23:59:59 LA
  assert.equal(countdownDays(exp, new Date("2026-09-23T06:59:59.999Z")), 0); // truncated to the second
  assert.equal(countdownDays(exp, new Date("2026-09-23T07:00:00Z")), null); // Wed 00:00 LA: gone
  assert.equal(countdownDays(exp, new Date("2026-09-22T06:59:59Z")), 1); // Mon 23:59:59 LA
  assert.equal(countdownDays(exp, new Date("2026-09-21T07:00:00Z")), 1); // Mon 00:00 LA
  assert.equal(countdownDays(exp, new Date("2026-09-21T06:59:59Z")), 2);
});

test("countdown: chip strings are the demo layer's, character for character", () => {
  for (let d = 0; d <= 400; d++) assert.equal(formatCountdown(d), formatDaysRemaining(d));
});

test("code128: the symbol table holds its invariants", () => {
  const seen = new Set<string>();
  for (let v = 0; v <= 106; v++) {
    const p = code128Pattern(v);
    const widths = [...p].map(Number);
    const sum = widths.reduce((a, b) => a + b, 0);
    assert.equal(sum, v === 106 ? 13 : 11, `value ${v}`);
    const bars = widths.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);
    assert.equal(bars % 2, 0, `value ${v}: bar modules must be even`);
    assert.ok(!seen.has(p), `value ${v}: duplicate pattern`);
    seen.add(p);
  }
});

test("code128: checksum, and rejection of anything outside printable ASCII", () => {
  // Start B (104) + a(65)*1 + b(66)*2 + c(67)*3 = 104+65+132+201 = 502; 502 mod 103 = 90.
  assert.deepEqual(code128Values("abc"), [104, 65, 66, 67, 90, 106]);
  assert.throws(() => encodeCode128("café"));
  assert.throws(() => encodeCode128("a\nb"));
  assert.throws(() => encodeCode128(""));
});

// Rows produced by Apple's CICode128BarcodeGenerator (quietSpace 10), sampled
// at 1 px per module on 2026-09-22 by a 20-line Swift script on macOS. The
// strings mix case or avoid digit runs so CoreImage stays in subset B;
// together they exercise every printable ASCII symbol. The clip will draw
// Code 128 with that same generator, so web and clip bars are identical.
const COREIMAGE_CODE128: [string, string][] = [
  ["papex coupon",
    "0000000000110100100001010011110010010110000101001111001011001000011110010010110110011001000010110010001111010100111100101010011110010001111010110000101001100101000011000111010110000000000"],
  ["hello world",
    "00000000001101001000010011000010101100100001100101000011001010000100011110101101100110011110010100100011110101001001111011001010000100001001101010001111011000111010110000000000"],
  ["abc",
    "0000000000110100100001001011000010010000110100001011001101111011011000111010110000000000"],
  ["exm~bogo{x}",
    "00000000001101001000010110010000111100100101111011101010001011110100100001101000111101010011010000100011110101111011011011110010010101000111101101000111011000111010110000000000"],
  ["the quick brown fox jumps over",
    "0000000000110100100001001111010010011000010101100100001101100110010010111100100111100101000011010010000101100110000100101101100110010010000110100100111101000111101011110010100110000101001101100110010110000100100011110101111001001011011001100100001100101001111001011110111010101001111001011110010011011001100100011110101111010010010110010000100100111101011110010011000111010110000000000"],
  ["!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~",
    "00000000001101001000011001101100110011001101001001100010010001100100010011001001100100010011000100100011001001100100100011001000100110001001001011001110010011011100100110011101011100110011100100110111011001001110011010011100110010110110110001101100011011000110110111000110101110111101011001000010111100010101010011000010100001100111101101101010111100010100011110100010111101010001111011000111010110000000000"],
  ["AbCdEfGhIjKlMnOpQrStUvWxYz",
    "00000000001101001000010100011000100100001101000100011010000100110100011010001011000010011010001000100110000101100010001010000110010101100011101100101000010111011000110000101001000111011010100111100110100011101001001111011011101000100111101001101110111011110100100111010001101111001001011101101000110111101101011110010011000111010110000000000"],
  ["zzzz",
    "000000000011010010000110111101101101111011011011110110110111101101111011101011000111010110000000000"],
  ["aBcDeFgHiJkLmNoPqRsTuVwXyZ",
    "00000000001101001000010010110000100010110001000010110010110001000101100100001000110001010011010000110001010001000011010010110111000110000100101000110111011110111010101110001101000111101011101110110100101111001100010111010111100100110111000101001111001011101011000111100101001110001011011011011110111011000101000111101011000111010110000000000"],
  ["a1b2c3d4e5f6g7h8i9j0",
    "00000000001101001000010010110000100111001101001000011011001110010100001011001100101110010000100110110010011101011001000011011100100101100001001100111010010011010000111011011101001100001011101001100100001101001110010110010000110010100111011001000011010011000111010110000000000"],
  ["EXM-BOGO-0926",
    "000000000011010010000100011010001110001011010111011000100110111001000101100010001110110110100010001000111011010011011100100111011001110010110011001110010110011101001100100111011000111010110000000000"],
  ["EXM15OFF100",
    "00000000001101001000010001101000111000101101011101100010011100110110111001001000111011010001100010100011000101001110011010011101100100111011001110111011011000111010110000000000"],
];

test("code128: module-for-module identical to Apple's CICode128BarcodeGenerator", () => {
  const covered = new Set<string>();
  for (const [msg, row] of COREIMAGE_CODE128) {
    const mine = encodeCode128(msg).modules.map((b) => (b ? "1" : "0")).join("");
    assert.equal(mine, row, JSON.stringify(msg));
    for (const ch of msg) covered.add(ch);
  }
  for (let c = 0x20; c <= 0x7e; c++) assert.ok(covered.has(String.fromCharCode(c)), `no reference covers ${String.fromCharCode(c)}`);
});

test("ean13/upca: check digits, structure, and UPC-A as EAN-13 with a leading zero", () => {
  assert.equal(gs1CheckDigit("400638133393"), 1);
  assert.equal(gs1CheckDigit("03600029145"), 2);
  assert.ok(isValidEan13("4006381333931"));
  assert.ok(!isValidEan13("4006381333932"));
  assert.ok(isValidUpcA("036000291452"));
  assert.ok(!isValidUpcA("036000291453"));
  const ean = encodeEan13("4006381333931").modules;
  assert.equal(ean.length, 11 + 95 + 7);
  const bits = ean.map((b) => (b ? "1" : "0")).join("").slice(11, 11 + 95);
  assert.equal(bits.slice(0, 3), "101"); // start guard
  assert.equal(bits.slice(45, 50), "01010"); // centre guard
  assert.equal(bits.slice(92), "101"); // end guard
  // First digit 4 sets the left-half parity LGLLGG: the second digit (0) in L, the third (0) in G.
  assert.equal(bits.slice(3, 10), "0001101");
  assert.equal(bits.slice(10, 17), "0100111");
  // Right half is always R: last digit 1.
  assert.equal(bits.slice(85, 92), "1100110");
  assert.deepEqual(encodeUpcA("036000291452").modules, encodeEan13("0036000291452").modules);
  assert.throws(() => encodeEan13("4006381333932"));
});

test("barRuns: merges adjacent bar modules into rects", () => {
  assert.deepEqual(barRuns([false, true, true, false, true, false]), [
    [1, 2],
    [4, 1],
  ]);
});

// =============================================================================
// DEMO projection
// =============================================================================

test("demo: projections match the committed goldens (fixtures/demo)", () => {
  for (const { sid, file } of DEMO_GOLDENS) {
    const golden = readJson(join(CONTRACT, "fixtures/demo", file));
    assert.deepEqual(projectDemo(sid, GOLDEN_CLOCK), golden, `${file} is stale: npx tsx lib/cards/cards.test.ts --update-golden`);
  }
});

test("demo: every demo sid projects to a schema-valid response the decoder keeps whole", () => {
  for (const sid of DEMO_RECEIPTS.keys()) {
    for (const iso of ["2026-08-01T00:00:00Z", "2026-10-05T17:00:00Z", "2026-10-20T23:59:59Z", "2027-03-01T12:00:00Z"]) {
      const r = projectDemo(sid, new Date(iso));
      assert.ok(validate(r), `${sid} @ ${iso}: ${schemaErrors()}`);
      const out = normalizeResolvedCards(r, sid);
      assert.deepEqual(out.dropped, [], `${sid} @ ${iso}`);
      assert.deepEqual(out.cards, r.cards);
    }
  }
});

test("demo: each enrichment section maps onto exactly one card type, in page order", () => {
  const SECTION_TO_TYPE: [keyof NonNullable<ReturnType<typeof getDemoEnrichment>>, Card["type"]][] = [
    ["fabricated", "disclosure"],
    ["savings", "savings"],
    ["loyalty", "loyalty"],
    ["insight", "insight"],
    ["offer", "offer"],
    ["emailOptIn", "emailCapture"],
  ];
  for (const [sid, e] of DEMO_RECEIPTS) {
    const r = projectDemo(sid, GOLDEN_CLOCK);
    const expected = SECTION_TO_TYPE.filter(([section]) => Boolean(e[section])).map(([, type]) => type);
    assert.deepEqual(r.cards.map((c) => c.type), expected, sid);
    assert.equal(r.status, expected.length > 0 ? "ok" : "none", sid);
    assert.ok(r.cards.every((c) => c.mode === "preview"), `${sid}: demo cards are preview`);
  }
});

test("demo: capture is partner-only at the source too", () => {
  for (const sid of DEMO_RECEIPTS.keys()) {
    const r = projectDemo(sid, GOLDEN_CLOCK);
    assert.equal(r.merchant.partner, DEMO_PARTNER_SIDS.has(sid));
    if (!r.merchant.partner) assert.ok(r.cards.every((c) => c.type !== "emailCapture"), sid);
  }
  const withOptIn = { emailOptIn: { label: "Share my email with Hartwell's Market.", subLabel: "Any time." } };
  const clock = { now: GOLDEN_CLOCK, offerDaysRemaining: null };
  assert.equal(projectDemoEnrichment(withOptIn, clock, false).length, 0, "a registry opt-in on a non-partner yields no card");
  assert.equal(projectDemoEnrichment(withOptIn, clock, true).length, 1);
});

test("demo: the card countdown equals offerDaysRemaining on every day, at every hour", () => {
  for (const [sid, e] of DEMO_RECEIPTS) {
    if (!e.offer) continue;
    for (let day = 0; day < 240; day++) {
      for (const hour of [0, 7, 13, 23]) {
        const now = new Date(Date.UTC(2026, 7, 1 + day, hour, hour === 23 ? 59 : 0, hour === 23 ? 59 : 0));
        const expected = offerDaysRemaining(e, now);
        const offer = projectDemo(sid, now).cards.find((c) => c.type === "offer");
        assert.ok(offer && offer.type === "offer");
        const actual = offer.validity ? countdownDays(offer.validity.expiresAt, now) : null;
        assert.equal(actual, expected, `${sid} @ ${now.toISOString()}`);
      }
    }
  }
});

test("demo: expiresAt is the end of the UTC day the demo window closes", () => {
  assert.equal(endOfUtcDayAfter(new Date("2026-10-05T17:00:00Z"), 15), "2026-10-20T23:59:59Z");
  assert.equal(endOfUtcDayAfter(new Date("2026-10-05T00:00:00Z"), 0), "2026-10-05T23:59:59Z");
  const ellsworth = projectDemo("b0de9a0000000001", GOLDEN_CLOCK).cards.find((c) => c.type === "offer");
  assert.ok(ellsworth && ellsworth.type === "offer");
  // 2026-09-08 + 42 days, the window lib/demoReceipts.ts documents.
  assert.equal(ellsworth.validity?.expiresAt, "2026-10-20T23:59:59Z");
});

// =============================================================================
// No HTML injection surface anywhere in the cards code
// =============================================================================

test("no raw-HTML sink anywhere under lib/cards or app/r/cards", () => {
  // Built by concatenation so this file does not match itself.
  const needles = ["dangerously" + "SetInnerHTML", "__" + "html", ".inner" + "HTML", ".outer" + "HTML", "insertAdjacent" + "HTML", "document" + ".write"];
  for (const dir of [resolve(__dirname), resolve(__dirname, "../../app/r/cards")]) {
    for (const f of readdirSync(dir)) {
      if (!/\.(ts|tsx)$/.test(f)) continue;
      const src = readFileSync(join(dir, f), "utf8");
      for (const n of needles) assert.ok(!src.includes(n), `${f} contains ${n}`);
    }
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
