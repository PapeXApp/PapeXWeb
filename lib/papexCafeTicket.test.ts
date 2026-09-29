// lib/papexCafeTicket.test.ts — run with `npm run test:papexCafe` (tsx).
//
// The /business demo ticket re-labels a copy of the /customers ticket. A swap
// whose pattern drifted from the source used to be a silent no-op (the card
// line kept printing 4729); these checks make that loud.

import assert from "node:assert/strict";
import { demoReceiptBytes } from "../components/paths/customer/demoReceipt";
import {
  TICKET_CARD_FROM,
  TICKET_CARD_TO,
  TICKET_HEADER_FROM,
  TICKET_HEADER_TO,
  papexCafeReceiptBytes,
  replaceOnce,
} from "../components/paths/business/papexCafeTicket";
import { parseEscPos } from "./escpos";
import { extractLastFour, summarizeReceipt } from "./receiptSummary";

const asText = (b: Uint8Array) => Array.from(b, (c) => String.fromCharCode(c)).join("");
let n = 0;
const test = (name: string, fn: () => void) => {
  fn();
  n++;
  console.log(`ok - ${name}`);
};

test("both swap patterns exist in the shared demo ticket", () => {
  const src = asText(demoReceiptBytes());
  assert.ok(src.includes(TICKET_HEADER_FROM), `missing ${TICKET_HEADER_FROM}`);
  assert.ok(src.includes(TICKET_CARD_FROM), `missing ${TICKET_CARD_FROM}`);
});

test("the card swap is same-length (the ticket line keeps its width)", () => {
  assert.equal(TICKET_CARD_TO.length, TICKET_CARD_FROM.length);
});

test("PapeX Cafe ticket prints PAPEX CAFE and Card ************4242, 32 columns", () => {
  const text = asText(papexCafeReceiptBytes());
  assert.ok(text.includes(TICKET_HEADER_TO));
  assert.ok(!text.includes(TICKET_HEADER_FROM));
  assert.ok(!text.includes("4729"), "old last-4 still printed");
  const cardLine = text.split("\n").find((l) => l.startsWith("Card "));
  assert.equal(cardLine, "Card ************4242   APPROVED");
  assert.equal(cardLine!.length, 32);
});

test("the decoded summary carries last-4 4242", () => {
  const summary = summarizeReceipt(parseEscPos(papexCafeReceiptBytes()).lines);
  assert.ok(summary.paymentLine, "no payment line");
  assert.equal(extractLastFour(summary.paymentLine!), "4242");
  assert.ok(!/visa|mastercard|amex|discover/i.test(summary.paymentLine!));
});

test("replaceOnce throws outside production when the pattern is missing", () => {
  assert.throws(() => replaceOnce("abc", "zzz", "y"), /no longer in the demo ticket/);
  assert.equal(replaceOnce("a-b-a", "a", "X"), "X-b-a");
});

console.log(`\n${n} papexCafeTicket tests passed`);
