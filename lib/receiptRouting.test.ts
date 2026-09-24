// lib/receiptRouting.test.ts
//
// Standalone test script for `/r`'s sid > rid > demo/bare precedence (no test
// framework in this repo — see package.json). Run with:
//   npm run test:routing
//
// This is the P0 fix's core contract: a `rid` link must resolve to the rid
// path whenever a `sid` isn't effectively present, and must NEVER be
// consulted when a sid is — a `rid` accidentally winning over a malformed
// `sid` would silently change what an RDH tap shows.

import assert from "node:assert/strict";
import { resolveReceiptRoute } from "./receiptRouting";

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

const VALID_SID = "a1b2c3d4e5f60718";
const RID = "receipt_1776344585632_4mrd9txmk";

// ---- sid wins by presence ----------------------------------------------------

test("sid present + rid present -> sid (rid never consulted)", () => {
  assert.deepEqual(
    resolveReceiptRoute({ sidParam: VALID_SID, ridParam: RID, demoRequested: false }),
    { kind: "sid" },
  );
});

test("a MALFORMED sid still wins over a well-formed rid", () => {
  assert.deepEqual(
    resolveReceiptRoute({ sidParam: "not-a-real-sid", ridParam: RID, demoRequested: false }),
    { kind: "sid" },
  );
});

test("sid as an array param: presence checked on the first entry", () => {
  assert.deepEqual(
    resolveReceiptRoute({ sidParam: [VALID_SID, "extra"], ridParam: RID, demoRequested: false }),
    { kind: "sid" },
  );
});

test("a blank/whitespace-only sid does NOT count as present — rid still wins", () => {
  assert.deepEqual(
    resolveReceiptRoute({ sidParam: "   ", ridParam: RID, demoRequested: false }),
    { kind: "rid", rid: RID },
  );
  assert.deepEqual(
    resolveReceiptRoute({ sidParam: "", ridParam: RID, demoRequested: false }),
    { kind: "rid", rid: RID },
  );
});

// ---- demo opt-in wins over rid ------------------------------------------------

test("?demo=1 wins over rid when sid is absent", () => {
  assert.deepEqual(
    resolveReceiptRoute({ sidParam: undefined, ridParam: RID, demoRequested: true }),
    { kind: "demo" },
  );
});

// ---- rid ----------------------------------------------------------------------

test("rid alone, no sid, no demo -> rid", () => {
  assert.deepEqual(
    resolveReceiptRoute({ sidParam: undefined, ridParam: RID, demoRequested: false }),
    { kind: "rid", rid: RID },
  );
});

test("rid is trimmed", () => {
  assert.deepEqual(
    resolveReceiptRoute({ sidParam: undefined, ridParam: `  ${RID}  `, demoRequested: false }),
    { kind: "rid", rid: RID },
  );
});

test("rid as an array param: first entry used", () => {
  assert.deepEqual(
    resolveReceiptRoute({ sidParam: undefined, ridParam: [RID, "extra"], demoRequested: false }),
    { kind: "rid", rid: RID },
  );
});

test("a malformed-looking rid string still routes to rid (format validation is downstream)", () => {
  assert.deepEqual(
    resolveReceiptRoute({ sidParam: undefined, ridParam: "@@not valid@@", demoRequested: false }),
    { kind: "rid", rid: "@@not valid@@" },
  );
});

// ---- bare -----------------------------------------------------------------

test("nothing at all -> demo (bare /r)", () => {
  assert.deepEqual(
    resolveReceiptRoute({ sidParam: undefined, ridParam: undefined, demoRequested: false }),
    { kind: "demo" },
  );
});

test("blank rid, no sid, no demo -> demo (bare /r), not an empty rid lookup", () => {
  assert.deepEqual(
    resolveReceiptRoute({ sidParam: undefined, ridParam: "   ", demoRequested: false }),
    { kind: "demo" },
  );
});

// ---- Summary ----------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
