// lib/__fixtures__/demoBlobs.ts
//
// A byte-exact copy of the ESC/POS blob seeded in S3 behind each Tech Week
// demo sid — the actual paper, as the adapter serves it and as a phone renders
// it. Consumed by lib/demoBlobParity.test.ts, which asserts that every figure
// in lib/demoReceipts.ts agrees with what is printed here.
//
// ---------------------------------------------------------------------------
// WHY A COPY OF THE PAPER LIVES IN THE REPO
// ---------------------------------------------------------------------------
// The enrichment registry restates figures that are printed on the receipt:
// the date, the store, the savings line, the loyalty rungs, the price paid for
// the hero SKU. Nothing checked that restatement, and on 2026-09-17 it turned
// out to be wrong — the blobs had been re-minted on 2026-09-11 onto new
// printed dates and the registry kept the drafting-era ones, 28 and 21 days
// later, which is what the voucher countdown was anchored to.
//
// A test cannot reach S3, so the paper is committed instead. That makes the
// restatement checkable on every run, and it makes the receipt itself
// reviewable in a diff: the text below is what the printer emitted, verbatim,
// with only the ESC/POS control bytes escaped.
//
// ---------------------------------------------------------------------------
// WHAT THIS DOES AND DOES NOT PROVE
// ---------------------------------------------------------------------------
// It proves the registry agrees with THIS COPY of the blob. It cannot prove
// this copy still matches S3 — only a fetch can, and S3 is the authority. So:
// RE-MINTING A DEMO SID MEANS REFRESHING THIS FILE IN THE SAME CHANGE.
//
//   curl -s https://api.papex.app/receipt/<sid> | shasum -a 256
//
// against the `sha256` recorded below answers "has the paper moved?" in one
// line, and `npm run test:demoBlobs` answers "does the registry still match
// the paper?".
//
// Captured 2026-09-17 from https://api.papex.app/receipt/<sid> (HTTP 200).
// ---------------------------------------------------------------------------

/** One seeded demo receipt, exactly as the printer emitted it. */
export interface SeededDemoBlob {
  /** The demo sid the blob is seeded under. */
  sid: string;
  /** What it is, for a failure message. */
  description: string;
  /** Date this copy was fetched from the live API, `YYYY-MM-DD`. */
  capturedAt: string;
  /** sha256 of the raw bytes, for the one-line "has the paper moved?" check. */
  sha256: string;
  /** The raw bytes, latin1-encoded above and decoded back here. */
  bytes: Uint8Array;
}

/** latin1 text -> bytes. Every byte in these blobs is < 128. */
function bytesOf(text: string): Uint8Array {
  return Uint8Array.from(text, (c) => c.charCodeAt(0));
}

// ---------------------------------------------------------------------------
// Hartwell's Market #218 — the CONSUMER-pitch demo
// ---------------------------------------------------------------------------
const HARTWELLS_TEXT = `\x1b@\x1ba\x01\x1b!0HARTWELL'S MARKET  #218
\x1b!\x002180 Crestmoor Center Drive
San Mateo, CA 94402
(650) 555-0142
\x1ba\x00------------------------------------------
WED 09/02/26 18:42   TERM 04   TRANS 1187
CASHIER: DENISE M.
------------------------------------------
BOUNTY SEL-A-SIZE 12=24  25% OFF     20.99
CLOVER 2% MILK GAL                    5.99
2 x CHOBANI GREEK YOGURT 32OZ        12.98
DAVES KILLER BREAD 21WG  $1.50 OFF    6.49
3 x HASS AVOCADO                      3.75
ORG BABY SPINACH 16OZ                 5.99
FOSTER FARMS CHKN THIGH 1.83LB        9.86
BARILLA PENNE RIGATE 16OZ             2.29
RAOS HOMEMADE MARINARA 24OZ           8.49
KERRYGOLD BUTTER 8OZ                  4.99
2 x LA CROIX GRAPEFRUIT 12PK B1G1 50% 8.99
SEVENTH GEN DISH SOAP 19OZ            4.29
CA REDEMPTION VALUE 24 @ .05          1.20
YOU SAVED $11.49 (3 ITEMS)            0.00
------------------------------------------
SUBTOTAL                             96.30
TAX                                   3.41
\x1bE\x01TOTAL                                99.71
\x1bE\x00------------------------------------------
VISA DEBIT ****4417  APPROVED         99.71
CHIP  AID A0000000980840
------------------------------------------
HARTWELL'S REWARDS
POINTS EARNED TODAY: 96 PTS
POINTS BALANCE: 1,240 PTS (WORTH $24)
NEXT $2 REWARD AT 1,300 PTS
------------------------------------------
\x1ba\x01TAP YOUR PHONE ON THE READER
FOR YOUR DIGITAL RECEIPT
DEMO RECEIPT - NOT A REAL STORE
\x1ba\x00\x1dV\x00`;

export const HARTWELLS_BLOB: SeededDemoBlob = {
  sid: "5ca1e00000000001",
  description: "Hartwell's Market #218 — the CONSUMER-pitch demo",
  capturedAt: "2026-09-17",
  sha256: "06fcfaf8b23fa6378b9b9162147df6ada4ff76392bcdf7e64c5133c4841072af",
  bytes: bytesOf(HARTWELLS_TEXT),
};

// ---------------------------------------------------------------------------
// Ellsworth Market #47 — the MERCHANT-pitch demo
// ---------------------------------------------------------------------------
const ELLSWORTH_TEXT = `\x1b@\x1ba\x01\x1b!0ELLSWORTH MARKET  #47
\x1b!\x00815 Belmont Crossing Way
Pasadena, CA 91106
(626) 555-0198
\x1ba\x00------------------------------------------
TUE 09/08/26 17:58   LANE 2   TRANS 40911
CASHIER: MARCUS T.
------------------------------------------
TIDE ORIG HE LIQ 92OZ 64LD $3 OFF    15.99
HORIZON ORG WHOLE MILK HALF GAL       5.49
TILLAMOOK SHARP CHEDDAR 8OZ           4.99
2 x BUSHS BLACK BEANS 15OZ            3.58
MISSION FLOUR TORTILLA 10CT           3.49
ROMAINE HEARTS 3CT       $1.00 OFF    4.49
ROMA TOMATO 1.42 LB                   2.83
GROUND BEEF 85/15 1.21 LB             8.45
PACE CHUNKY SALSA 16OZ                3.99
TOPO CHICO MINERAL WTR 12PK           9.49
CA REDEMPTION VALUE 12 @ .05          0.60
CREST 3D WHITE 3.8OZ                  4.79
YOU SAVED $4.00 (2 ITEMS)             0.00
------------------------------------------
SUBTOTAL                             68.18
TAX                                   3.24
\x1bE\x01TOTAL                                71.42
\x1bE\x00------------------------------------------
MASTERCARD ****2286  APPROVED         71.42
CHIP  AID A0000000041010
------------------------------------------
ELLSWORTH REWARDS
POINTS EARNED TODAY: 68 PTS
POINTS BALANCE: 1,180 PTS (WORTH $10)
NEXT $2 REWARD AT 1,200 PTS
------------------------------------------
\x1ba\x01TAP YOUR PHONE ON THE READER
FOR YOUR DIGITAL RECEIPT
DEMO RECEIPT - NOT A REAL STORE
\x1ba\x00\x1dV\x00`;

export const ELLSWORTH_BLOB: SeededDemoBlob = {
  sid: "b0de9a0000000001",
  description: "Ellsworth Market #47 — the MERCHANT-pitch demo",
  capturedAt: "2026-09-17",
  sha256: "964be54bbc39176a0f78d7a79e9734aa159d53809925dee9ff591026efba08b3",
  bytes: bytesOf(ELLSWORTH_TEXT),
};

/** Every seeded blob this repo keeps a copy of, by sid. */
export const SEEDED_DEMO_BLOBS: readonly SeededDemoBlob[] = [HARTWELLS_BLOB, ELLSWORTH_BLOB];
