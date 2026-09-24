// app/r/testPageHarness.tsx
//
// TEST-ONLY. Runs the real `/r`, `/r/demo` and `/demo/r` page components in a
// plain Node process, the way Next's server does, so a test can hold their
// rendered HTML to a golden:
//   - `next/headers` is replaced with a stub whose user agent the test sets
//     (the only request state these pages read);
//   - `globalThis.fetch` is replaced with a router over canned upstream
//     responses (RDH bytes, /parsed, /cards, the sharedReceipt function), and
//     every call is recorded;
//   - `Date` is frozen, so countdown chips don't move with the calendar;
//   - pages render with React's own server renderer (Fizz), awaiting every
//     Suspense boundary, which is what the browser ends up with.
// Import it FIRST in a test (it imports ./cards/testCssModules itself), before
// any page module, so the stubs exist when the page's `require` runs.
// Next never loads this file.

import "./cards/testCssModules";
import Module from "node:module";
import { Writable } from "node:stream";
import type { ReactNode } from "react";
import { renderToPipeableStream } from "react-dom/server";
import { prerenderToNodeStream } from "react-dom/static";

// ---- next/headers ---------------------------------------------------------------

export const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1";
export const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";

export const testRequest = { userAgent: IPHONE_UA };

{
  const req = Module.createRequire(__filename);
  const id = req.resolve("next/headers");
  const stub = new Module(id);
  stub.filename = id;
  stub.loaded = true;
  stub.exports = {
    headers: async () => new Headers({ "user-agent": testRequest.userAgent }),
  };
  req.cache[id] = stub;
}

// ---- Date --------------------------------------------------------------------------

/** The frozen "now" every page render sees: 2026-10-01 10:00 PDT. */
export const FIXED_NOW_MS = Date.parse("2026-10-01T17:00:00Z");
/** The page clock. Tests may move it (e.g. past an offer's expiry) and must put it back. */
export const testClock = { nowMs: FIXED_NOW_MS };
{
  const RealDate = Date;
  class FixedDate extends RealDate {
    constructor(...args: unknown[]) {
      if (args.length === 0) super(testClock.nowMs);
      else super(...(args as [string]));
    }
    static now() {
      return testClock.nowMs;
    }
  }
  globalThis.Date = FixedDate as DateConstructor;
}

// ---- fetch ---------------------------------------------------------------------------

export const RDH = "https://api.papex.app";
export const SHARED = "https://us-central1-papexv2.cloudfunctions.net";

/** One canned upstream answer. `hang` never answers; it rejects when the caller aborts. */
export type Upstream =
  | { status: number; body?: Uint8Array | string; contentType?: string; delayMs?: number }
  | { hang: true };

export const json = (status: number, body: unknown, delayMs?: number): Upstream => ({
  status,
  body: JSON.stringify(body),
  contentType: "application/json",
  delayMs,
});
export const bytes = (b: Uint8Array): Upstream => ({ status: 200, body: b, contentType: "application/octet-stream" });
export const status = (s: number): Upstream => ({ status: s, body: "" });
export const HANG: Upstream = { hang: true };

export interface FetchCall {
  url: string;
  /** ms after the render started. */
  at: number;
}

let routes = new Map<string, Upstream>();
export let calls: FetchCall[] = [];
let startedAt = 0;

/**
 * Install the upstream answers for one scenario. A URL with no route answers
 * 404 (for the cards endpoint that is exactly "not deployed"), and is still
 * recorded, so an unexpected call shows up in `calls`.
 */
export function setUpstreams(next: Record<string, Upstream>) {
  routes = new Map(Object.entries(next));
  calls = [];
  startedAt = performance.now();
}

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  calls.push({ url, at: performance.now() - startedAt });
  const up = routes.get(url) ?? status(404);
  const signal = init?.signal;
  if ("hang" in up) {
    return new Promise<Response>((_, reject) => {
      if (signal?.aborted) return reject(new DOMException("aborted", "AbortError"));
      signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    });
  }
  if (up.delayMs) {
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, up.delayMs);
      signal?.addEventListener("abort", () => {
        clearTimeout(t);
        reject(new DOMException("aborted", "AbortError"));
      });
    });
  }
  return new Response(up.status === 204 ? null : (up.body ?? ""), {
    status: up.status,
    headers: up.contentType ? { "Content-Type": up.contentType } : {},
  });
}) as typeof fetch;

// ---- rendering -------------------------------------------------------------------------

/** Render to the final HTML, every Suspense boundary resolved. */
export async function renderHtml(node: ReactNode): Promise<string> {
  const { prelude } = await prerenderToNodeStream(node);
  const chunks: Buffer[] = [];
  for await (const chunk of prelude) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

export interface StreamedChunk {
  html: string;
  /** ms after rendering started. */
  at: number;
}

/**
 * Render as Next streams a response: the shell first (everything outside a
 * pending Suspense boundary), then each boundary as it resolves. Returns the
 * chunks in the order they were written.
 */
export function renderStream(node: ReactNode): Promise<StreamedChunk[]> {
  const t0 = performance.now();
  const chunks: StreamedChunk[] = [];
  return new Promise((resolve, reject) => {
    const sink = new Writable({
      write(chunk, _enc, cb) {
        chunks.push({ html: Buffer.from(chunk).toString("utf8"), at: performance.now() - t0 });
        cb();
      },
      final(cb) {
        cb();
        resolve(chunks);
      },
    });
    const stream = renderToPipeableStream(node, {
      onShellReady() {
        stream.pipe(sink);
      },
      onShellError: reject,
    });
  });
}

/** A redirect thrown by next/navigation, as `{url}`; anything else rethrows. */
export function redirectTarget(err: unknown): string | null {
  const digest = (err as { digest?: unknown })?.digest;
  if (typeof digest !== "string" || !digest.startsWith("NEXT_REDIRECT")) return null;
  return digest.split(";")[2] ?? null;
}

// ---- a tiny runner (the repo's standalone-script pattern) ------------------------------

let passed = 0;
let failed = 0;

export async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok - ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL - ${name}`);
    console.error(err instanceof Error ? (err.stack ?? err.message) : err);
  }
}

export function finish() {
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
  // Fizz and the aborted fetches leave nothing that should hold the process,
  // but a stray timer must not turn a green run into a hang.
  process.exit(0);
}
