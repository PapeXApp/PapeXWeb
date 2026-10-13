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
  photoAvailableIn,
  resolveSharedReceiptPageState,
  sharedReceiptApiBase,
  sharedReceiptPhotoUrl,
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


  // ---- the photo (1.7.2 #30) ----------------------------------------------------
  //
  // The function says `photo: {available: true}`; the page builds the URL of the
  // bytes and the browser fetches them. Everything below is also what makes the
  // page safe to deploy BEFORE the function: no `photo` key means no photo.

  const RID = "receipt_1776344585632_4mrd9txmk";
  const GOOD_URL = `https://us-central1-papexv2.cloudfunctions.net/sharedReceipt?rid=${RID}&photo=1`;
  const withPhoto = (extra: Record<string, unknown> = {}) => ({ ...REAL_PAYLOAD, photo: { available: true }, ...extra });
  const EMPTY_RECEIPT = { merchantName: null, total: null, lineItems: [] };

  await test("photoAvailableIn: only an explicit {available: true} counts", () => {
    assert.equal(photoAvailableIn({ photo: { available: true } }), true);
    for (const body of [
      {}, null, undefined, "x", 3, [], { photo: null }, { photo: {} }, { photo: { available: false } },
      { photo: { available: "true" } }, { photo: { available: 1 } }, { photo: true }, { photo: "yes" },
      { hasImage: true }, { photo: [{ available: true }] },
    ]) {
      assert.equal(photoAvailableIn(body), false, JSON.stringify(body));
    }
  });

  await test("sharedReceiptPhotoUrl: the function, rid encoded, &photo=1, honoring the base override", () => {
    assert.equal(sharedReceiptPhotoUrl(RID), GOOD_URL);
    const prior = process.env.SHARED_RECEIPT_API_BASE;
    process.env.SHARED_RECEIPT_API_BASE = "http://127.0.0.1:9999/";
    try {
      assert.equal(sharedReceiptPhotoUrl("a_b-c"), "http://127.0.0.1:9999/sharedReceipt?rid=a_b-c&photo=1");
    } finally {
      if (prior === undefined) delete process.env.SHARED_RECEIPT_API_BASE;
      else process.env.SHARED_RECEIPT_API_BASE = prior;
    }
  });

  await test("fetchSharedReceipt: photoAvailable follows the envelope", async () => {
    await withFetch((async () => jsonResponse(200, withPhoto())) as typeof fetch, async () => {
      const r = await fetchSharedReceipt(RID);
      assert.equal(r.status === "ok" && r.photoAvailable, true);
    });
    await withFetch((async () => jsonResponse(200, REAL_PAYLOAD)) as typeof fetch, async () => {
      const r = await fetchSharedReceipt(RID);
      assert.equal(r.status === "ok" && r.photoAvailable, false);
    });
  });

  await test("page state: a receipt with a photo -> real, with the photo URL", async () => {
    await withFetch((async () => jsonResponse(200, withPhoto())) as typeof fetch, async () => {
      const state = await resolveSharedReceiptPageState(RID);
      assert.equal(state.kind, "real");
      if (state.kind === "real") {
        assert.equal(state.photoSrc, GOOD_URL);
        assert.equal(state.receipt.merchantName, "CASH RECEIPT"); // the text is unchanged
      }
    });
  });

  await test("page state: NO photo key (the function before #30) -> real, photoSrc null: web may ship first", async () => {
    await withFetch((async () => jsonResponse(200, REAL_PAYLOAD)) as typeof fetch, async () => {
      const state = await resolveSharedReceiptPageState(RID);
      assert.equal(state.kind, "real");
      if (state.kind === "real") assert.equal(state.photoSrc, null);
    });
  });

  await test("page state: photo null / unavailable / junk -> real, photoSrc null", async () => {
    for (const photo of [null, { available: false }, {}, "x", 7, true]) {
      await withFetch((async () => jsonResponse(200, withPhoto({ photo }))) as typeof fetch, async () => {
        const state = await resolveSharedReceiptPageState(RID);
        assert.equal(state.kind, "real", JSON.stringify(photo));
        if (state.kind === "real") assert.equal(state.photoSrc, null, JSON.stringify(photo));
      });
    }
  });

  await test("page state: an unreadable receipt WITH a photo -> photo_only; without one -> not_available", async () => {
    await withFetch(
      (async () => jsonResponse(200, { ...REAL_PAYLOAD, receipt: EMPTY_RECEIPT, photo: { available: true } })) as typeof fetch,
      async () => {
        assert.deepEqual(await resolveSharedReceiptPageState(RID), { kind: "photo_only", photoSrc: GOOD_URL });
      },
    );
    await withFetch(
      (async () => jsonResponse(200, { ...REAL_PAYLOAD, receipt: EMPTY_RECEIPT })) as typeof fetch,
      async () => {
        assert.deepEqual(await resolveSharedReceiptPageState(RID), { kind: "not_available" });
      },
    );
  });

  await test("page state: the photo never rescues a 404, an error or a malformed rid", async () => {
    await withFetch((async () => jsonResponse(404, withPhoto())) as typeof fetch, async () => {
      assert.deepEqual(await resolveSharedReceiptPageState(RID), { kind: "not_available" });
    });
    await withFetch((async () => jsonResponse(500, withPhoto())) as typeof fetch, async () => {
      assert.deepEqual(await resolveSharedReceiptPageState(RID), { kind: "error" });
    });
    let called = false;
    await withFetch((async () => { called = true; return jsonResponse(200, withPhoto()); }) as typeof fetch, async () => {
      assert.deepEqual(await resolveSharedReceiptPageState("has space"), { kind: "not_available" });
    });
    assert.equal(called, false);
  });

  await test("the page itself never fetches the photo: one request, the JSON", async () => {
    const urls: string[] = [];
    await withFetch(
      (async (input: RequestInfo | URL) => {
        urls.push(String(input));
        return jsonResponse(200, withPhoto());
      }) as typeof fetch,
      async () => {
        await resolveSharedReceiptPageState(RID);
      },
    );
    assert.deepEqual(urls, [`https://us-central1-papexv2.cloudfunctions.net/sharedReceipt?rid=${RID}`]);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

void main();
