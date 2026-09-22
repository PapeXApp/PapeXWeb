// app/r/cards/cards.test.tsx
//
// Renderer tests for the receipt cards (format v1). Standalone tsx script, no
// test framework (same pattern as components/DecodedText.test.tsx). Run with:
//   npm run test:cardsRender
//
// What it proves:
//   - every card type in contracts/cards/v1/fixtures/valid renders, and shows
//     its text;
//   - untrusted strings are text, never markup; a bad URL never becomes an
//     href, even if a forged card skips the normalizer;
//   - unknown and invalid cards are skipped/dropped, and a card that throws
//     while rendering costs only itself;
//   - email capture is partner-only and inert: no form, no field names, no
//     usable input, no submit;
//   - Save is an inert printed instruction, not a control;
//   - NO VISUAL REGRESSION on /demo/r: for every demo sid, at clocks across
//     and beyond the offer windows, the card renderer emits the SAME markup
//     the old value-layer renderer (../enrichment.tsx + DemoDisclosure) did.

import "./testCssModules"; // must stay first: registers the .css loader before any component loads
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { normalizeResolvedCards, type NormalizedCards } from "@/lib/cards/normalize";
import { demoResolvedCards } from "@/lib/cards/demoSource";
import type { Card, CtaCard, EmailCaptureCard, ResolvedCards } from "@/lib/cards/types";
import { DEMO_RECEIPTS, formatDemoDisclosure, offerDaysRemaining } from "@/lib/demoReceipts";
import { EnrichmentSections } from "../enrichment";
import { DemoDisclosure } from "../ui";
import { CardList } from "./CardList";
import { CtaCardView } from "./CtaCard";
import { EmailCaptureCardView, INERT_CAPTURE_NOTE } from "./EmailCaptureCard";

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

const CONTRACT = resolve(__dirname, "../../../contracts/cards/v1");
const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));
const fixture = (name: string) => readJson(join(CONTRACT, "fixtures", name));

const NOW = new Date("2026-10-01T17:00:00Z");

/** Decode + render, exactly the page's path. */
function renderResponse(response: unknown, sid: string, now = NOW): string {
  return renderToStaticMarkup(<CardList cards={normalizeResolvedCards(response, sid)} now={now} />);
}
function renderFixture(name: string, now = NOW): string {
  const r = fixture(name) as ResolvedCards;
  return renderResponse(r, r.sid, now);
}
/** Text as React would escape it in a text node. */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}
/** Every display string in a card, for "does it show its text" checks. */
function strings(card: Card): string[] {
  const out: string[] = [];
  const walk = (v: unknown, key?: string) => {
    if (typeof v === "string") {
      if (!["id", "type", "mode", "voice", "icon", "style", "url", "privacyUrl", "expiresAt", "symbology", "textId", "value"].includes(key ?? "")) out.push(v);
    } else if (Array.isArray(v)) v.forEach((x) => walk(x));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, k);
  };
  walk(card);
  return out;
}

// =============================================================================
// Every card type renders
// =============================================================================

test("every valid fixture renders every card, showing all of its text", () => {
  const dir = join(CONTRACT, "fixtures/valid");
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    const r = readJson(join(dir, f)) as ResolvedCards;
    const html = renderResponse(r, r.sid);
    if (r.status === "none" || r.status === "degraded") {
      assert.equal(html, "", `${f}: renders nothing`);
      continue;
    }
    for (const card of r.cards) {
      for (const s of strings(card)) assert.ok(html.includes(esc(s)), `${f} / ${card.id}: missing ${JSON.stringify(s)}`);
    }
  }
});

test("text: merchant voice is warm paint, PapeX voice is glass", () => {
  const html = renderFixture("valid/text.json");
  const [merchant, papex] = html.split("From PapeX");
  assert.ok(merchant.includes("merchantPanel") && !merchant.includes('class="card'), "merchant text is not on glass");
  assert.ok(papex.includes("card ") && !papex.includes("merchantPanel"), "PapeX text is on glass");
});

test("offer: code, caption, countdown chip, and no chip once expired", () => {
  const html = renderFixture("valid/offer-code.json");
  assert.ok(html.includes("EXM15OFF100"));
  assert.ok(html.includes("Give this code at the register"));
  // expiresAt 2026-10-06T06:59:59Z; at 2026-10-01T17:00Z that is 4 days 13:59:59 away.
  assert.ok(html.includes(">4 days left<"), "chip");
  const lastDay = renderFixture("valid/offer-code.json", new Date("2026-10-05T20:00:00Z"));
  assert.ok(lastDay.includes(">Last day<"));
  const after = renderFixture("valid/offer-code.json", new Date("2026-10-06T07:00:00Z"));
  assert.ok(!after.includes("left<") && !after.includes("Last day") && !/expired/i.test(after), "no chip, never 'Expired'");
  assert.ok(after.includes("EXM15OFF100"), "the voucher itself stays");
});

test("offer: Save is an inert printed line, not a button or link", () => {
  const html = renderFixture("valid/offer-code.json");
  assert.ok(html.includes("Save this offer to PapeX"));
  assert.ok(!html.includes("<button") && !html.includes("<a ") && !html.includes("<form"), html);
});

test("offer: barcodes render as SVG rects with a readable line; countdown:false shows no chip", () => {
  const code128 = renderFixture("valid/offer-barcode-code128.json");
  assert.ok(code128.includes("<svg") && code128.includes("<rect"), "svg bars");
  assert.ok(code128.includes('aria-label="Barcode EXM-BOGO-0926"'));
  assert.ok(!code128.includes("days left") && !code128.includes("Last day"));
  const ean = renderFixture("valid/offer-barcode-ean13.json");
  assert.ok(ean.includes("4 006381 333931"), "custom human-readable text");
  assert.ok(ean.includes(">036000291452<"), "value as the readable line by default");
  assert.equal((ean.match(/<svg/g) ?? []).length, 2);
});

test("cta: an allowed https link, opened safely", () => {
  const html = renderFixture("valid/cta.json");
  assert.ok(html.includes('href="https://order.example.com/example-market?src=papex"'));
  assert.ok(html.includes('target="_blank"') && html.includes('rel="noopener noreferrer"'));
});

// =============================================================================
// Untrusted text and URLs
// =============================================================================

test("hostile strings render as inert text, never as markup", () => {
  const html = renderFixture("valid/hostile-strings.json");
  for (const tag of ["<script", "<img", "<h1", "<b>", "<svg/onload", "</p><h1"]) {
    assert.ok(!html.includes(tag), `markup leaked: ${tag}`);
  }
  assert.ok(html.includes("&lt;script&gt;alert(&#x27;title&#x27;)&lt;/script&gt;"));
  assert.ok(html.includes("&lt;svg/onload=x&gt;"));
  assert.ok(html.includes("{{merchant.name}}"), "no client-side templating");
  assert.ok(html.includes("**not markdown**"), "no Markdown interpretation");
  assert.ok(html.includes("👨‍👩‍👧"), "ZWJ emoji intact");
  assert.ok(!/href="(?!https:\/\/)/.test(html), "no non-https href");
});

test("invalid cards and bad URLs never reach the page", () => {
  const c = fixture("client/invalid-known-cards-dropped.json") as { requestSid: string; response: unknown };
  const html = renderResponse(c.response, c.requestSid);
  assert.ok(html.includes("Card keep."));
  for (const leaked of ["javascript:", "http://example.com", "evil.example", "data:text", "Missing valueLabel", "\u202E"]) {
    assert.ok(!html.includes(leaked), `leaked ${leaked}`);
  }
  assert.equal((html.match(/<a /g) ?? []).length, 0);
});

test("a forged CTA that skipped the normalizer still gets no href", () => {
  for (const url of ["javascript:alert(1)", "http://example.com/", "https://user@example.com/", "data:text/html,x"]) {
    const card: CtaCard = { id: "x", type: "cta", mode: "live", voice: "papex", label: "Go", url, style: "primary" };
    assert.equal(renderToStaticMarkup(<>{CtaCardView({ card })}</>), "", url);
  }
});

test("unknown card types are skipped; their neighbours render", () => {
  const c = fixture("client/unknown-type-skipped.json") as { requestSid: string; response: unknown };
  const html = renderResponse(c.response, c.requestSid);
  assert.ok(html.includes("Card a.") && html.includes("Disclosure."));
  assert.ok(!html.includes("Did you enjoy it?"));
});

test("a card that throws while rendering costs only itself", () => {
  const forged: NormalizedCards = {
    status: "ok",
    merchant: { partner: false, ageRestricted: false },
    dropped: [],
    cards: [
      { id: "before", type: "text", mode: "live", voice: "papex", body: "Before." },
      // An EAN-13 with a bad check digit: the encoder throws inside the guard.
      {
        id: "boom",
        type: "offer",
        mode: "live",
        valueLabel: "$1",
        title: "Should not render.",
        redemption: { type: "barcode", symbology: "ean13", value: "4006381333932" },
      },
      { id: "after", type: "text", mode: "live", voice: "papex", body: "After." },
    ],
  };
  const html = renderToStaticMarkup(<CardList cards={forged} now={NOW} />);
  assert.ok(html.includes("Before.") && html.includes("After."));
  assert.ok(!html.includes("Should not render."), "no half-drawn voucher");
});

test("no cards, no markup: the page is exactly the one that shipped before cards", () => {
  assert.equal(renderFixture("valid/status-none.json"), "");
  assert.equal(renderFixture("valid/status-degraded.json"), "");
  assert.equal(renderResponse(undefined, "c0ffee0000000001"), "");
  assert.equal(renderResponse({ schemaVersion: 2 }, "c0ffee0000000001"), "");
});

// =============================================================================
// Email capture: partner-only, inert
// =============================================================================

test("email capture: partner-only at render time too", () => {
  const r = fixture("valid/email-capture.json") as ResolvedCards;
  const card = r.cards[0] as EmailCaptureCard;
  assert.equal(renderToStaticMarkup(<>{EmailCaptureCardView({ card, partner: false })}</>), "");
  assert.ok(renderToStaticMarkup(<>{EmailCaptureCardView({ card, partner: true })}</>).includes("Share my email"));
  // And through the page path, a non-partner envelope loses the card entirely.
  const nonPartner = { ...r, merchant: { partner: false, ageRestricted: false } };
  assert.ok(!renderResponse(nonPartner, r.sid).includes("Share my email"));
});

test("email capture: inert, with nothing that could submit, whatever the mode", () => {
  for (const name of ["valid/email-capture.json", "valid/email-capture-age-restricted.json"]) {
    const html = renderFixture(name);
    assert.ok(!html.includes("<form"), `${name}: form`);
    assert.ok(!/\sname="/.test(html), `${name}: a named control`);
    assert.ok(!/\s(action|formaction|formAction)=/.test(html), `${name}: a submit target`);
    assert.ok(!html.includes('type="submit"'), `${name}: submit button`);
    assert.ok(!/\schecked(=|\s|>)/.test(html), `${name}: a pre-checked box`);
  }
  // The live-mode fixture carries an email field: disabled, read-only, and labelled as a preview.
  const live = renderFixture("valid/email-capture-age-restricted.json");
  assert.ok(/<input type="email" disabled="" readOnly=""/.test(live), live);
  assert.ok(/<button type="button" disabled=""/.test(live));
  assert.ok(live.includes(esc(INERT_CAPTURE_NOTE)));
  assert.ok(live.includes("I am 21 or older."), "age affirmation");
  assert.equal((live.match(/type="checkbox"/g) ?? []).length, 2, "consent + age, both unchecked");
  assert.ok(live.includes('href="https://papex.app/privacy"'));
});

// =============================================================================
// No client islands
// =============================================================================

test("no card view is a client component", () => {
  for (const f of readdirSync(__dirname).filter((x) => /\.tsx?$/.test(x) && !x.endsWith(".test.tsx"))) {
    const src = readFileSync(join(__dirname, f), "utf8");
    assert.ok(!/^\s*["']use client["']/m.test(src), `${f} is a client component`);
    assert.ok(!src.includes("SaveToPapex") || f === "shared.tsx" || !/import .*SaveToPapex/.test(src), `${f} imports the claim island`);
  }
});

// =============================================================================
// No visual regression on /demo/r
// =============================================================================
//
// Byte-identical markup is the strongest statement available without a
// browser: same elements, same classes (the CSS stub makes a class its own
// name, so `voucher.ticket` is compared by identity), same inline styles,
// same text. The one structural change is intended and invisible: the
// disclosure line moved INTO the list container. Both containers are
// `flex flex-col gap-4` inside the page's own `gap-4` column, so every gap
// is still 16px.

const LIST_OPEN = '<div class="flex flex-col gap-4">';

/**
 * React 19 hoists a `<link rel="preload" as="image">` for every <img> to the
 * front of the output (into <head> on a real page). Split them off so the
 * comparison is of the body, and compare the preloads separately.
 */
function splitPreloads(html: string): { preloads: string; body: string } {
  const m = /^(?:<link [^>]*\/>)*/.exec(html);
  const preloads = m ? m[0] : "";
  return { preloads, body: html.slice(preloads.length) };
}

function oldLayer(sid: string, now: Date): string {
  const e = DEMO_RECEIPTS.get(sid);
  const disclosure = formatDemoDisclosure(e);
  const disc = disclosure ? renderToStaticMarkup(<DemoDisclosure text={disclosure} />) : "";
  const { preloads, body: enr } = splitPreloads(
    renderToStaticMarkup(<EnrichmentSections enrichment={e} daysRemaining={offerDaysRemaining(e, now)} />),
  );
  if (enr === "") return disc === "" ? "" : `${LIST_OPEN}${disc}</div>`;
  assert.ok(enr.startsWith(LIST_OPEN) && enr.endsWith("</div>"), "old layer shape changed");
  return `${preloads}${LIST_OPEN}${disc}${enr.slice(LIST_OPEN.length)}`;
}

function newLayer(sid: string, now: Date): string {
  const e = DEMO_RECEIPTS.get(sid);
  const cards = normalizeResolvedCards(demoResolvedCards(sid, { now, offerDaysRemaining: offerDaysRemaining(e, now) }), sid);
  assert.deepEqual(cards.dropped, []);
  return renderToStaticMarkup(<CardList cards={cards} now={now} />);
}

test("demo parity: the card renderer draws the old value layer byte for byte, on every clock", () => {
  const clocks = [
    "2026-08-01T00:00:00Z", // before either receipt was printed: full window
    "2026-09-22T12:00:00Z", // today
    "2026-10-05T17:00:00Z", // SF Tech Week opens
    "2026-10-18T23:59:59Z", // LA Tech Week closes
    "2026-10-20T12:00:00Z", // Ellsworth's last day
    "2026-10-21T00:00:00Z", // Ellsworth closed, Hartwell's open
    "2026-11-01T23:59:59Z", // Hartwell's last second
    "2027-03-01T12:00:00Z", // a tap in March: both closed, chips gone
  ];
  for (const sid of DEMO_RECEIPTS.keys()) {
    for (const iso of clocks) {
      const now = new Date(iso);
      assert.equal(newLayer(sid, now), oldLayer(sid, now), `${sid} @ ${iso}`);
    }
  }
});

test("demo parity: Sunset Leaf (no enrichment) renders nothing, as before", () => {
  assert.equal(newLayer("5371e4f000000001", NOW), "");
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
