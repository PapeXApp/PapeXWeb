// lib/demoBlobParity.test.ts
//
// Does the enrichment registry agree with the paper?
//
// Run with:
//   npm run test:demoBlobs
// (uses `tsx`, same pattern as the other lib/*.test.ts scripts in this repo.)
//
// ---------------------------------------------------------------------------
// WHAT THIS EXISTS TO CATCH
// ---------------------------------------------------------------------------
// lib/demoReceipts.ts restates figures that are PRINTED ON THE RECEIPT: the
// purchase date, the store, the savings line, the loyalty rungs, the price
// paid for the SKU the insight block is about. Its own tests check the
// arithmetic that is checkable from the map alone — components sum to the
// savings total, the balance floor-divides to the stated worth — but they
// cannot see the blob, and until this file existed nothing could.
//
// That gap had already cost something. The two demo blobs were re-minted on
// 2026-09-11 onto new printed dates (Hartwell's to WED 09/02, Ellsworth to
// TUE 09/08, six days apart on purpose) and the registry kept the drafting-era
// dates, 28 and 21 days later. `offerDaysRemaining()` anchors the voucher's
// "N days left" chip to `receiptDate`, so the countdown on the screen was
// measured from a date that is not on the paper in the visitor's hand.
//
// Every assertion below is against a committed byte-exact copy of the seeded
// blob — see lib/__fixtures__/demoBlobs.ts, which also documents the one-line
// check that the copy still matches S3, and the rule that re-minting a sid
// means refreshing the copy in the same change.
//
// The parse is the REAL one: parseEscPos + summarizeReceipt, exactly what
// app/r/page.tsx and app/r/demo/page.tsx run. So these are assertions about
// what the page will actually render, not about a convenient re-reading of
// the bytes.

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { parseEscPos } from "./escpos";
import { summarizeReceipt, type ReceiptSummary } from "./receiptSummary";
import { SEEDED_DEMO_BLOBS, type SeededDemoBlob } from "./__fixtures__/demoBlobs";
import { DEMO_RECEIPTS, getDemoEnrichment, type DemoReceiptEnrichment } from "./demoReceipts";

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

// ---- Reading the paper -------------------------------------------------------

interface Paper {
  blob: SeededDemoBlob;
  enrichment: DemoReceiptEnrichment;
  summary: ReceiptSummary;
  /** Every body line's text, verbatim — for the lines the summarizer does not model. */
  text: string[];
}

function read(blob: SeededDemoBlob): Paper {
  const receipt = parseEscPos(blob.bytes);
  const enrichment = getDemoEnrichment(blob.sid);
  assert.ok(enrichment, `${blob.sid}: seeded blob has no entry in DEMO_RECEIPTS`);
  return {
    blob,
    enrichment: enrichment!,
    summary: summarizeReceipt(receipt.lines),
    text: receipt.lines.map((l) => l.text),
  };
}

/** The single line matching `re`, or a failure naming what was looked for. */
function line(p: Paper, re: RegExp, what: string): RegExpExecArray {
  const hits = p.text.map((t) => re.exec(t)).filter((m): m is RegExpExecArray => m != null);
  assert.equal(hits.length, 1, `${p.blob.sid}: expected exactly one ${what} line, found ${hits.length}`);
  return hits[0];
}

/** "HARTWELL'S MARKET  #218" / "Hartwell's Market" -> "hartwells market". */
function normalizeStore(s: string): string {
  return s
    .replace(/#\s*\d+/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Money on a receipt is exact to the cent; compare as integer cents. */
const cents = (n: number) => Math.round(n * 100);

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const PAPERS = SEEDED_DEMO_BLOBS.map(read);

// ---- The copy of the paper is the paper ---------------------------------------

test("every committed blob matches its recorded digest", () => {
  // Guards the transcription itself. If this fails, the fixture was edited by
  // hand and nothing below it means anything.
  for (const { blob } of PAPERS) {
    const digest = createHash("sha256").update(blob.bytes).digest("hex");
    assert.equal(digest, blob.sha256, `${blob.sid}: fixture bytes do not match the recorded sha256`);
  }
});

test("every blob parses to a structured receipt", () => {
  // A demo blob that only renders as a flat bitmap is the exact failure the
  // registry's "TEXT ESC/POS, never a raster" rule exists to prevent, so the
  // parse being structured is itself an assertion worth making.
  for (const p of PAPERS) {
    assert.ok(p.summary.merchantName, `${p.blob.sid}: no merchant name parsed`);
    assert.ok(p.summary.total != null, `${p.blob.sid}: no total parsed`);
    assert.ok(p.summary.items.length > 0, `${p.blob.sid}: no line items parsed`);
  }
});

// ---- The receipt adds up ------------------------------------------------------

test("paper arithmetic: the line items sum to the printed subtotal", () => {
  for (const p of PAPERS) {
    // The `YOU SAVED` row is a $0.00 annotation, not a purchase; it is in
    // `items` because it is shaped like one, and it contributes nothing.
    const sum = p.summary.items.reduce((acc, it) => acc + cents(it.amount), 0);
    assert.equal(sum, cents(p.summary.subtotal!), `${p.blob.sid}: items do not sum to SUBTOTAL`);
  }
});

test("paper arithmetic: subtotal + tax is the printed total", () => {
  for (const p of PAPERS) {
    assert.equal(
      cents(p.summary.subtotal!) + cents(p.summary.tax!),
      cents(p.summary.total!),
      `${p.blob.sid}: SUBTOTAL + TAX is not TOTAL`,
    );
  }
});

test("paper arithmetic: the tendered amount is the total", () => {
  // A demo where the card is charged something other than the total is the
  // kind of detail one person in the room always checks.
  for (const p of PAPERS) {
    const m = line(p, /APPROVED\s+([\d,]+\.\d{2})$/, "payment");
    assert.equal(
      cents(Number(m[1].replace(/,/g, ""))),
      cents(p.summary.total!),
      `${p.blob.sid}: the approved amount is not the total`,
    );
  }
});

// ---- The date: the field that drifted -----------------------------------------

test("the registry's receiptDate is the date printed on the paper", () => {
  // THE REGRESSION TEST. `receiptDate` anchors the voucher countdown, and it
  // is a transcription of the dateline below it — nothing else.
  for (const p of PAPERS) {
    const m = line(p, /^([A-Z]{3}) (\d{2})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})\b/, "dateline");
    const [, , mm, dd, yy] = m;
    const printed = `20${yy}-${mm}-${dd}`;
    assert.equal(
      p.enrichment.receiptDate,
      printed,
      `${p.blob.sid}: registry says ${p.enrichment.receiptDate}, the paper prints ${printed}`,
    );
  }
});

test("the paper's own weekday agrees with its own date", () => {
  // The Tue/Wed split across the two demos is deliberate content — Ellsworth
  // is a mid-week fill-in shop, which is what makes its $75 floor read as
  // reachable — so a receipt whose weekday and date disagree is not a
  // cosmetic defect, it is the framing coming apart.
  for (const p of PAPERS) {
    const m = line(p, /^([A-Z]{3}) (\d{2})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})\b/, "dateline");
    const [, weekday, mm, dd, yy] = m;
    const utc = new Date(Date.UTC(2000 + Number(yy), Number(mm) - 1, Number(dd)));
    assert.equal(
      weekday,
      WEEKDAYS[utc.getUTCDay()],
      `${p.blob.sid}: the paper prints ${weekday} on 20${yy}-${mm}-${dd}`,
    );
  }
});

// ---- The store ----------------------------------------------------------------

test("the registry's merchantName is the store printed on the paper", () => {
  for (const p of PAPERS) {
    assert.ok(p.enrichment.merchantName, `${p.blob.sid}: no merchantName in the registry`);
    assert.equal(
      normalizeStore(p.enrichment.merchantName!),
      normalizeStore(p.summary.merchantName!),
      `${p.blob.sid}: registry store name differs from the printed header`,
    );
  }
});

// ---- The savings line ---------------------------------------------------------

test("the registry's savings total and count are the printed YOU SAVED row", () => {
  for (const p of PAPERS) {
    const m = line(p, /YOU SAVED \$([\d,]+\.\d{2}) \((\d+) ITEMS?\)/, "YOU SAVED");
    const printedTotal = Number(m[1].replace(/,/g, ""));
    const printedCount = Number(m[2]);
    assert.ok(p.enrichment.savings, `${p.blob.sid}: paper prints a savings row, registry has none`);
    assert.equal(
      cents(p.enrichment.savings!.total),
      cents(printedTotal),
      `${p.blob.sid}: registry savings total differs from the printed YOU SAVED`,
    );
    assert.equal(
      p.enrichment.savings!.components.length,
      printedCount,
      `${p.blob.sid}: registry lists ${p.enrichment.savings!.components.length} savings components, ` +
        `the paper says ${printedCount} items`,
    );
  }
});

test("as many line items carry a discount marker as the registry has components", () => {
  // Deliberately counts markers rather than matching labels: the registry
  // spells names out ("Dave's Killer Bread 21 Whole Grains") where the printer
  // abbreviates ("DAVES KILLER BREAD 21WG"), and a fuzzy matcher would fail
  // for reasons that have nothing to do with the figures.
  for (const p of PAPERS) {
    const marked = p.summary.items.filter(
      (it) => /\d+% OFF|\$[\d.]+ OFF|B\d+G\d+/.test(it.label) && it.amount > 0,
    );
    assert.equal(
      marked.length,
      p.enrichment.savings!.components.length,
      `${p.blob.sid}: ${marked.length} discounted line items on the paper, ` +
        `${p.enrichment.savings!.components.length} components in the registry`,
    );
  }
});

// ---- The insight block's one checkable figure ---------------------------------

test("the insight's pricePaidHere is what the paper charged for that SKU", () => {
  // The single most dangerous figure in the registry: it is a factual price
  // claim about a named shopper at a named store, printed next to the paper
  // that would contradict it.
  for (const p of PAPERS) {
    const insight = p.enrichment.insight;
    if (!insight) continue;
    const { pricePaidHere, skuShortLabel } = insight.evidence;
    const hits = p.summary.items.filter((it) => cents(it.amount) === cents(pricePaidHere));
    assert.equal(
      hits.length,
      1,
      `${p.blob.sid}: ${hits.length} line items charged ${pricePaidHere}, expected exactly one`,
    );
    assert.ok(
      hits[0].label.toUpperCase().includes(skuShortLabel.toUpperCase()),
      `${p.blob.sid}: the line charging ${pricePaidHere} is "${hits[0].label}", ` +
        `which is not a ${skuShortLabel}`,
    );
  }
});

test("the insight never claims the shopper beat a price she did not beat", () => {
  // typicalPrice and previousBest are PapeX's own history and are not on the
  // paper — but their relationship to the printed price is the whole claim,
  // and it is checkable.
  for (const p of PAPERS) {
    const insight = p.enrichment.insight;
    if (!insight) continue;
    const { pricePaidHere, previousBest, typicalPrice } = insight.evidence;
    assert.ok(
      pricePaidHere < previousBest,
      `${p.blob.sid}: paid ${pricePaidHere}, previous best ${previousBest} — "lowest yet" is false`,
    );
    assert.ok(
      previousBest <= typicalPrice,
      `${p.blob.sid}: previous best ${previousBest} is above the typical price ${typicalPrice}`,
    );
  }
});

// ---- The loyalty footer -------------------------------------------------------

test("the registry's loyalty programme is the one printed in the footer", () => {
  for (const p of PAPERS) {
    const loyalty = p.enrichment.loyalty;
    if (!loyalty) continue;
    const names = p.text.filter((t) => normalizeStore(t) === normalizeStore(loyalty.programName));
    assert.equal(names.length, 1, `${p.blob.sid}: "${loyalty.programName}" is not the footer's programme name`);
  }
});

test("the registry's loyalty figures are the ones printed in the footer", () => {
  for (const p of PAPERS) {
    const loyalty = p.enrichment.loyalty;
    if (!loyalty) continue;

    const earned = line(p, /POINTS EARNED TODAY:\s+([\d,]+) PTS/, "points earned");
    assert.equal(
      loyalty.pointsEarned,
      Number(earned[1].replace(/,/g, "")),
      `${p.blob.sid}: registry points earned differs from the paper`,
    );

    const balance = line(p, /POINTS BALANCE:\s+([\d,]+) PTS \(WORTH \$([\d,]+)\)/, "points balance");
    assert.equal(
      loyalty.pointsBalance,
      Number(balance[1].replace(/,/g, "")),
      `${p.blob.sid}: registry points balance differs from the paper`,
    );
    assert.equal(
      loyalty.balanceValue,
      Number(balance[2].replace(/,/g, "")),
      `${p.blob.sid}: registry balance value differs from the paper`,
    );

    const next = line(p, /NEXT \$([\d,]+) REWARD AT ([\d,]+) PTS/, "next reward");
    assert.equal(
      loyalty.rewardValue,
      Number(next[1].replace(/,/g, "")),
      `${p.blob.sid}: registry reward value differs from the paper`,
    );
    assert.equal(
      loyalty.nextRewardAt,
      Number(next[2].replace(/,/g, "")),
      `${p.blob.sid}: registry next-reward rung differs from the paper`,
    );
  }
});

test("points earned are one per pre-tax dollar, as both programmes claim", () => {
  // Both seeded programmes run 1 point per $1 of subtotal — the arithmetic a
  // person can do out loud while holding the receipt ("ninety-six dollars,
  // ninety-six points"). A programme at a different rate means changing this
  // assertion deliberately, which is the point of it being here.
  for (const p of PAPERS) {
    const loyalty = p.enrichment.loyalty;
    if (!loyalty) continue;
    assert.equal(
      loyalty.pointsEarned,
      Math.floor(p.summary.subtotal!),
      `${p.blob.sid}: ${loyalty.pointsEarned} pts on a ${p.summary.subtotal} subtotal is not 1 pt/$1`,
    );
  }
});

// ---- The offer's relationship to the basket ------------------------------------

test("a basket minimum sits above the basket the shopper just filled", () => {
  // The merchant demo's whole argument. A floor at or below the total she
  // already reached is not a return-visit incentive, it is a discount she has
  // already earned, and the pitch inverts.
  for (const p of PAPERS) {
    const min = p.enrichment.offer?.minimumBasket;
    if (min == null) continue;
    assert.ok(
      cents(min) > cents(p.summary.total!),
      `${p.blob.sid}: $${min} minimum is not above the $${p.summary.total} basket`,
    );
  }
});

// ---- The disclosure ------------------------------------------------------------

test("every fabricated demo discloses itself on the paper itself", () => {
  // The web layer carries its own disclosure (formatDemoDisclosure), but a
  // photograph of the paper travels without it — so the blob must say so too.
  for (const p of PAPERS) {
    if (!p.enrichment.fabricated) continue;
    const hits = p.text.filter((t) => /DEMO RECEIPT - NOT A REAL STORE/.test(t));
    assert.equal(hits.length, 1, `${p.blob.sid}: fabricated demo does not disclose itself in the blob`);
  }
});

test("the disclosure line did not become a phantom line item", () => {
  // It is appended to the footer as text, and the summarizer turns anything
  // shaped like "<label> <amount>" into a purchase. The line carries no
  // trailing money, so it must not appear in `items`.
  for (const p of PAPERS) {
    const leaked = p.summary.items.filter((it) => /DEMO RECEIPT/i.test(it.label));
    assert.equal(leaked.length, 0, `${p.blob.sid}: the disclosure leaked into the line items`);
  }
});

// ---- Coverage ------------------------------------------------------------------

test("every enriched demo sid has a committed copy of its paper", () => {
  // Sunset Leaf (5371e4f000000001) is deliberately absent: its payload is
  // empty, it is real seeded data from a real provisioned merchant rather
  // than an invented store, and there is nothing restated to check. Any sid
  // that carries figures has figures that can be wrong.
  const withCopies = new Set(SEEDED_DEMO_BLOBS.map((b) => b.sid));
  for (const [sid, enrichment] of DEMO_RECEIPTS) {
    const carriesFigures =
      enrichment.savings != null || enrichment.loyalty != null || enrichment.insight != null;
    if (!carriesFigures) continue;
    assert.ok(
      withCopies.has(sid),
      `${sid} restates figures from its blob but lib/__fixtures__/demoBlobs.ts has no copy of it`,
    );
  }
});

// ---- Summary -------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
