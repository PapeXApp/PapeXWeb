// app/api/rdh/merchant/proxy.test.ts
//
// Run with: npm run test:merchantProxy
//
// The merchant proxy's write path: POST reaches exactly one upstream route, and
// only with a token. Everything else on the RDH API stays out of reach.

import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET, POST } from "./[...path]/route";

const calls: { url: string; method: string; headers: Record<string, string>; body: string }[] = [];
const realFetch = globalThis.fetch;
globalThis.fetch = (async (url: string, init: RequestInit) => {
  calls.push({
    url: String(url),
    method: init.method ?? "GET",
    headers: init.headers as Record<string, string>,
    body: init.body ? new TextDecoder().decode(init.body as ArrayBuffer) : "",
  });
  return new Response(JSON.stringify({ ok: true, version: 2 }), { status: 200, headers: { "content-type": "application/json" } });
}) as typeof fetch;

const post = (path: string[], body: string, token: string | null = "Bearer t") =>
  POST(
    new NextRequest("http://merchant.localhost/api/rdh/merchant/" + path.join("/"), {
      method: "POST",
      body,
      headers: { ...(token ? { authorization: token } : {}), cookie: "secret=1", "x-merchant-id": "doobie-nights" },
    }),
    { params: Promise.resolve({ path }) },
  );
const get = (path: string[]) =>
  GET(new NextRequest("http://merchant.localhost/api/rdh/merchant/" + path.join("/"), { headers: { authorization: "Bearer t" } }), {
    params: Promise.resolve({ path }),
  });

async function main() {
  const ok = await post(["cards", "publish"], '{"dryRun":true}');
  assert.equal(ok.status, 200);
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /\/merchant\/cards\/publish$/);
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].body, '{"dryRun":true}');
  assert.deepEqual(Object.keys(calls[0].headers).sort(), ["Accept", "Authorization", "Content-Type"], "no cookies or client headers go upstream");

  calls.length = 0;
  for (const path of [["cards", "config"], ["cards"], ["transactions"], ["cards", "publish", "x"], ["receipt", "abc"], ["cards", ".."]]) {
    assert.equal((await post(path, "{}")).status, 404, path.join("/"));
  }
  assert.equal(calls.length, 0, "nothing else reaches upstream by POST");

  assert.equal((await post(["cards", "publish"], "{}", null)).status, 401);
  assert.equal((await post(["cards", "publish"], "x".repeat(65 * 1024))).status, 413);
  assert.equal(calls.length, 0);

  assert.equal((await get(["cards", "config"])).status, 200, "the Receipts tab's reads are allowed");
  assert.equal((await get(["cards", "reach"])).status, 200);
  assert.equal((await get(["nope"])).status, 404);

  globalThis.fetch = realFetch;
  console.log("merchant proxy: all passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
