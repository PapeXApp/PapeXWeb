// lib/sharedReceipt.test.ts
//
// Standalone test script for the `rid` fetch contract (no test framework in
// this repo — see package.json). Run with:
//   npm run test:sharedReceipt
//
// Mocks `global.fetch` directly — this repo has no fetch-mocking library, and
// lib/rdhParsed.ts's own tests only exercise `normalizePayload`, so this is a
// new (small, self-contained) pattern rather than a reused one.

import assert from "node:assert/strict";
import {
  fetchSharedReceipt,
  isValidRid,
  resolveSharedReceiptPageState,
  sharedReceiptApiBase,
} from "./sharedReceipt";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
      console.log(`  ok - ${name}`);
    })
    .catch((err) => {
      failed += 1;
      console.error(`  FAIL - ${name}`);
      console.error(err instanceof Error ? err.message : err);
    });
}

function withFetch(impl: typeof fetch, fn: () => Promise<void>) {
  const original = globalThis.fetch;
  globalThis.fetch = impl;
  return fn().finally(() => {
    globalThis.fetch = original;
  });
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const REAL_PAYLOAD = {
  sid: "receipt_1776344585632_4mrd9txmk",
  parseStatus: "ok",
  hasImage: false,
  uploadedAt: "2026-04-16T13:03:05.632Z",
  receipt: {
    merchantName: "CASH RECEIPT",
    merchantAddress: null,
    date: "2018-01-01 • 10:35",
    subtotal: null,
    tax: null,
    total: 84.8,
    lineItems: [{ name: "Item", quantity: 1, price: 84.8, sku: null }],
    paymentMethod: null,
    cardBrand: null,
    cardLast4: null,
    receiptNumber: null,
    confidence: null,
    extractorEngine: null,
  },
};

async function main() {
  // ---- isValidRid -------------------------------------------------------------

  await test("isValidRid accepts a real top-level Firestore-style id", () => {
    assert.equal(isValidRid("receipt_1776344585632_4mrd9txmk"), true);
  });

  await test("isValidRid accepts a bare 20-char Firestore auto-id", () => {
    assert.equal(isValidRid("aBcDeFgHiJkLmNoPqRsT"), true);
  });

  await test("isValidRid rejects anything outside [A-Za-z0-9_-]", () => {
    for (const bad of ["has space", "semi;colon", "emoji😀id", "a/b", ""]) {
      assert.equal(isValidRid(bad), false, `expected invalid: ${JSON.stringify(bad)}`);
    }
  });

  await test("isValidRid rejects over-length and non-string input", () => {
    assert.equal(isValidRid("a".repeat(65)), false);
    assert.equal(isValidRid("a".repeat(64)), true);
    assert.equal(isValidRid(undefined), false);
    assert.equal(isValidRid(null), false);
  });

  // ---- sharedReceiptApiBase -----------------------------------------------------

  await test("sharedReceiptApiBase defaults to the real papexv2 functions host", () => {
    delete process.env.SHARED_RECEIPT_API_BASE;
    assert.equal(sharedReceiptApiBase(), "https://us-central1-papexv2.cloudfunctions.net");
  });

  await test("sharedReceiptApiBase honors an override and strips trailing slashes", () => {
    process.env.SHARED_RECEIPT_API_BASE = "http://localhost:9999/";
    assert.equal(sharedReceiptApiBase(), "http://localhost:9999");
    delete process.env.SHARED_RECEIPT_API_BASE;
  });

  // ---- fetchSharedReceipt -------------------------------------------------------

  await test("fetchSharedReceipt: 200 with a valid envelope -> ok + normalized payload", async () => {
    await withFetch(
      (async (input: RequestInfo | URL) => {
        assert.ok(String(input).includes("/sharedReceipt?rid="));
        return jsonResponse(200, REAL_PAYLOAD);
      }) as typeof fetch,
      async () => {
        const result = await fetchSharedReceipt("receipt_1776344585632_4mrd9txmk");
        assert.equal(result.status, "ok");
        if (result.status === "ok") {
          assert.equal(result.payload.receipt?.merchantName, "CASH RECEIPT");
          assert.equal(result.payload.receipt?.total, 84.8);
        }
      },
    );
  });

  await test("fetchSharedReceipt: 404 -> not_found", async () => {
    await withFetch(
      (async () => jsonResponse(404, { error: "not_found" })) as typeof fetch,
      async () => {
        const result = await fetchSharedReceipt("ZZtestFAKEid00000JMPX");
        assert.deepEqual(result, { status: "not_found" });
      },
    );
  });

  await test("fetchSharedReceipt: 5xx -> error", async () => {
    await withFetch(
      (async () => jsonResponse(500, { error: "internal" })) as typeof fetch,
      async () => {
        const result = await fetchSharedReceipt("receipt_1776344585632_4mrd9txmk");
        assert.deepEqual(result, { status: "error" });
      },
    );
  });

  await test("fetchSharedReceipt: network failure -> error, never throws", async () => {
    await withFetch(
      (async () => {
        throw new TypeError("fetch failed");
      }) as typeof fetch,
      async () => {
        const result = await fetchSharedReceipt("receipt_1776344585632_4mrd9txmk");
        assert.deepEqual(result, { status: "error" });
      },
    );
  });

  await test("fetchSharedReceipt: 200 with an unrecognizable body -> error, not a crash", async () => {
    await withFetch(
      (async () => jsonResponse(200, { totally: "unexpected" })) as typeof fetch,
      async () => {
        const result = await fetchSharedReceipt("receipt_1776344585632_4mrd9txmk");
        assert.deepEqual(result, { status: "error" });
      },
    );
  });

  // ---- resolveSharedReceiptPageState (the actual /r?rid= contract) --------------
  //
  // This is the P0 fix's honesty gate for rid, same role as
  // lib/receiptState.ts's resolveReceiptState for sid: the sample must never
  // be reachable from here, whatever the backend says.

  await test("resolveSharedReceiptPageState: well-formed rid, usable receipt -> real", async () => {
    await withFetch(
      (async () => jsonResponse(200, REAL_PAYLOAD)) as typeof fetch,
      async () => {
        const state = await resolveSharedReceiptPageState("receipt_1776344585632_4mrd9txmk");
        assert.equal(state.kind, "real");
        if (state.kind === "real") {
          assert.equal(state.receipt.merchantName, "CASH RECEIPT");
          assert.equal(state.receipt.total, 84.8);
        }
      },
    );
  });

  await test("resolveSharedReceiptPageState: malformed rid -> not_available, fetch never called", async () => {
    await withFetch(
      (async () => {
        throw new Error("fetch must not be called for a malformed rid");
      }) as typeof fetch,
      async () => {
        const state = await resolveSharedReceiptPageState("has a space");
        assert.deepEqual(state, { kind: "not_available" });
      },
    );
  });

  await test("resolveSharedReceiptPageState: 404 -> not_available (never the sample)", async () => {
    await withFetch(
      (async () => jsonResponse(404, { error: "not_found" })) as typeof fetch,
      async () => {
        const state = await resolveSharedReceiptPageState("ZZtestFAKEid00000JMPX");
        assert.deepEqual(state, { kind: "not_available" });
      },
    );
  });

  await test("resolveSharedReceiptPageState: 200 but an empty receipt -> not_available", async () => {
    await withFetch(
      (async () =>
        jsonResponse(200, {
          sid: "x",
          parseStatus: "ok",
          hasImage: false,
          uploadedAt: null,
          receipt: { merchantName: null, total: null, lineItems: [] },
        })) as typeof fetch,
      async () => {
        const state = await resolveSharedReceiptPageState("receipt_1776344585632_4mrd9txmk");
        assert.deepEqual(state, { kind: "not_available" });
      },
    );
  });

  await test("resolveSharedReceiptPageState: network/backend failure -> error, never not_available or real", async () => {
    await withFetch(
      (async () => jsonResponse(500, { error: "internal" })) as typeof fetch,
      async () => {
        const state = await resolveSharedReceiptPageState("receipt_1776344585632_4mrd9txmk");
        assert.deepEqual(state, { kind: "error" });
      },
    );
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

void main();
