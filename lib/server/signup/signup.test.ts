// lib/server/signup/signup.test.ts
//
// Standalone tsx test script for the shared sign-up route's logic
// (lib/signup/schema.ts + lib/server/signup/*). Firestore and SES are
// replaced by in-memory fakes; nothing here touches a network or a real
// project. Run with: npm run test:signup

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cleanText, validateSignupInput, type DemoRequest } from "../../signup/schema";
import { submitSignup } from "../../signup/client";
import { buildNotificationEmail, readSesConfig, type NotificationEmail } from "./email";
import { handleSignup, MAX_SIGNUP_BODY_BYTES, type SignupDeps, type SignupHttpRequest } from "./handler";
import { clientIpFromHeaders, createRateLimiter } from "./rateLimit";
import {
  blogSubscriberId,
  buildWaitlistDoc,
  createFirestoreSignupStore,
  type MinimalFirestore,
  type SignupStore,
} from "./store";

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => Promise<void> | void) {
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

// ---- fakes ------------------------------------------------------------------

const SERVER_TS = Symbol("serverTimestamp");

interface FakeDb extends MinimalFirestore {
  adds: { collection: string; data: Record<string, unknown> }[];
  docs: Map<string, Record<string, unknown>>;
}

function fakeDb(): FakeDb {
  const adds: FakeDb["adds"] = [];
  const docs = new Map<string, Record<string, unknown>>();
  return {
    adds,
    docs,
    collection(name: string) {
      return {
        async add(data: object) {
          adds.push({ collection: name, data: data as Record<string, unknown> });
          return {};
        },
        doc(id: string) {
          return {
            async create(data: object) {
              const key = `${name}/${id}`;
              if (docs.has(key)) throw Object.assign(new Error("6 ALREADY_EXISTS: Document already exists"), { code: 6 });
              docs.set(key, data as Record<string, unknown>);
              return {};
            },
          };
        },
      };
    },
  };
}

interface Harness {
  deps: SignupDeps;
  db: FakeDb;
  sent: NotificationEmail[];
  logs: string[];
  scheduled: (() => Promise<void>)[];
  runScheduled(): Promise<void>;
}

function harness(opts: { store?: "fake" | "missing" | "broken"; ses?: boolean; sendFails?: boolean; limit?: number; isDev?: boolean } = {}): Harness {
  const db = fakeDb();
  const sent: NotificationEmail[] = [];
  const logs: string[] = [];
  const scheduled: (() => Promise<void>)[] = [];
  const store: SignupStore = createFirestoreSignupStore(db, () => SERVER_TS);
  const mode = opts.store ?? "fake";
  const deps: SignupDeps = {
    getStore: () => {
      if (mode === "missing") return null;
      if (mode === "broken") throw new Error("PAPEXWEB_SERVICE_ACCOUNT is not valid JSON (or base64 of JSON).");
      return store;
    },
    sendEmail:
      opts.ses === false
        ? null
        : async (email) => {
            if (opts.sendFails) throw Object.assign(new Error("boom"), { name: "SESError" });
            sent.push(email);
          },
    rateLimiter: createRateLimiter({ limit: opts.limit ?? 100, windowMs: 60_000, now: () => 0 }),
    schedule: (task) => {
      scheduled.push(task);
    },
    now: () => new Date("2026-09-24T12:00:00.000Z"),
    isDev: opts.isDev ?? false,
    log: { info: (m) => logs.push(`info ${m}`), error: (m) => logs.push(`error ${m}`) },
    storeEnvName: "PAPEXWEB_SERVICE_ACCOUNT",
  };
  return {
    deps,
    db,
    sent,
    logs,
    scheduled,
    async runScheduled() {
      for (const t of scheduled.splice(0)) await t();
    },
  };
}

function req(body: unknown, overrides: Partial<SignupHttpRequest> = {}): SignupHttpRequest {
  return {
    contentType: "application/json",
    bodyText: typeof body === "string" ? body : JSON.stringify(body),
    ip: "203.0.113.7",
    ...overrides,
  };
}

const DEMO = {
  kind: "demo",
  fullName: "Ada Lovelace",
  businessName: "Analytical Engines",
  email: "Ada@Example.com",
  phone: "(415) 555-0100",
  posSystem: "Blaze",
};

const BLOG = { kind: "blog", email: "Reader@Example.com", source: "footer", path: "/blog/hello-world" };

async function main() {
  console.log("signup: validation");

  await test("a valid demo request normalises and keeps email case", () => {
    const r = validateSignupInput({ ...DEMO, fullName: "  Ada \u0000Love\u202Elace\r\n " });
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.deepEqual(r.value, {
      kind: "demo",
      fullName: "Ada Love lace",
      businessName: "Analytical Engines",
      email: "Ada@Example.com",
      phone: "(415) 555-0100",
      posSystem: "Blaze",
    });
  });

  await test("optional demo fields default to empty strings", () => {
    const r = validateSignupInput({ kind: "demo", fullName: "A", businessName: "B", email: "a@b.co" });
    assert.ok(r.ok);
    if (r.ok && r.value.kind === "demo") {
      assert.equal(r.value.phone, "");
      assert.equal(r.value.posSystem, "");
    }
  });

  await test("demo field errors mirror the DemoForm's messages", () => {
    const r = validateSignupInput({ kind: "demo", fullName: " ", businessName: "", email: "nope", phone: "12" });
    assert.equal(r.ok, false);
    if (r.ok) return;
    assert.equal(r.error, "invalid_fields");
    assert.deepEqual(r.fields, {
      email: "Enter a valid email address.",
      fullName: "Your name is required.",
      businessName: "Business name is required.",
      phone: "Enter a valid phone number.",
    });
  });

  await test("max lengths are enforced", () => {
    const long = (n: number) => "x".repeat(n);
    const r = validateSignupInput({
      ...DEMO,
      fullName: long(121),
      businessName: long(161),
      posSystem: long(121),
      email: `${long(65)}@example.com`,
    });
    assert.equal(r.ok, false);
    if (!r.ok) assert.deepEqual(Object.keys(r.fields ?? {}).sort(), ["businessName", "email", "fullName", "posSystem"]);
    const r2 = validateSignupInput({ ...BLOG, email: `a@${long(250)}.com` });
    assert.equal(r2.ok, false);
  });

  await test("a valid blog sign-up lower-cases the email", () => {
    const r = validateSignupInput(BLOG);
    assert.deepEqual(r, { ok: true, value: { kind: "blog", email: "reader@example.com", source: "footer", path: "/blog/hello-world" } });
  });

  await test("blog: unknown source and unsafe paths are rejected", () => {
    for (const bad of [
      { ...BLOG, source: "sidebar" },
      { ...BLOG, path: "https://evil.example/x" },
      { ...BLOG, path: "//evil.example" },
      { ...BLOG, path: "/blog?x=1" },
      { ...BLOG, path: "/blog/<script>" },
    ]) {
      const r = validateSignupInput(bad);
      assert.equal(r.ok, false, JSON.stringify(bad));
    }
  });

  await test("unknown fields, wrong kinds and non-string values are rejected", () => {
    for (const bad of [
      { ...DEMO, isAdmin: true },
      { ...BLOG, fullName: "x" }, // demo-only key on a blog sign-up
      { ...DEMO, kind: "survey" },
      { ...DEMO, email: ["a@b.co"] },
      { ...DEMO, phone: 4155550100 },
      [DEMO],
      null,
      "demo",
    ]) {
      const r = validateSignupInput(bad);
      assert.equal(r.ok, false, JSON.stringify(bad));
      if (!r.ok) assert.ok(r.error === "invalid_request" || r.error === "invalid_fields");
    }
  });

  await test("cleanText strips CR/LF so nothing can smuggle a new line", () => {
    assert.equal(cleanText("a\r\nBcc: x@y.z"), "a Bcc: x@y.z");
    assert.equal(cleanText("﻿​hi\u0007"), "hi");
  });

  console.log("signup: handler");

  await test("demo request -> 200, waitlist doc saved, email scheduled", async () => {
    const h = harness();
    const res = await handleSignup(req(DEMO), h.deps);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { ok: true });
    assert.equal(h.db.adds.length, 1);
    assert.equal(h.db.adds[0].collection, "waitlist");
    assert.equal(h.scheduled.length, 1);
    await h.runScheduled();
    assert.equal(h.sent.length, 1);
    assert.equal(h.sent[0].subject, "PapeX: new demo request");
    assert.match(h.sent[0].text, /Analytical Engines/);
    assert.match(h.sent[0].text, /2026-09-24T12:00:00.000Z/);
  });

  await test("waitlist payload is exactly the shape DemoForm used to write", async () => {
    // Copied from the pre-route DemoForm.tsx addDoc(collection(db, "waitlist"), {...}).
    const OLD_KEYS = ["fullName", "businessName", "email", "phone", "posSystem", "type", "createdAt"];
    const h = harness();
    await handleSignup(req({ kind: "demo", fullName: " Ada ", businessName: "AE", email: " Ada@Example.com " }), h.deps);
    const doc = h.db.adds[0].data;
    assert.deepEqual(Object.keys(doc), OLD_KEYS);
    assert.deepEqual(doc, {
      fullName: "Ada",
      businessName: "AE",
      email: "Ada@Example.com",
      phone: "",
      posSystem: "",
      type: "business-demo-request",
      createdAt: SERVER_TS,
    });
    for (const k of OLD_KEYS.slice(0, 6)) assert.equal(typeof (doc as Record<string, unknown>)[k], "string", k);
    // buildWaitlistDoc is the single place that shape lives.
    const demo: DemoRequest = { kind: "demo", fullName: "a", businessName: "b", email: "c@d.ef", phone: "", posSystem: "" };
    assert.deepEqual(Object.keys(buildWaitlistDoc(demo, 1)), OLD_KEYS);
  });

  await test("blog sign-up -> blog_subscribers/{sha256(email)}; repeat is a silent no-op", async () => {
    const h = harness();
    const first = await handleSignup(req(BLOG), h.deps);
    assert.equal(first.status, 200);
    const id = createHash("sha256").update("reader@example.com").digest("hex");
    assert.equal(blogSubscriberId("  READER@example.com "), id);
    assert.deepEqual(h.db.docs.get(`blog_subscribers/${id}`), {
      email: "reader@example.com",
      source: "footer",
      path: "/blog/hello-world",
      createdAt: SERVER_TS,
    });
    const again = await handleSignup(req({ ...BLOG, email: "READER@example.com", source: "blog-post" }), h.deps);
    assert.deepEqual(again, { status: 200, body: { ok: true } }); // indistinguishable from a new sign-up
    assert.equal(h.db.docs.size, 1);
    assert.equal(h.db.docs.get(`blog_subscribers/${id}`)?.source, "footer"); // first sign-up wins
    assert.equal(h.scheduled.length, 1); // only the first one emails the team
  });

  await test("blog sign-up without a path stores no path key", async () => {
    const h = harness();
    await handleSignup(req({ kind: "blog", email: "x@y.co", source: "blog-index" }), h.deps);
    const [doc] = [...h.db.docs.values()];
    assert.deepEqual(Object.keys(doc), ["email", "source", "createdAt"]);
  });

  await test("honeypot filled -> fake 200, nothing saved, nothing emailed", async () => {
    const h = harness();
    const res = await handleSignup(req({ ...DEMO, hp: "http://spam.example" }), h.deps);
    assert.deepEqual(res, { status: 200, body: { ok: true } });
    assert.equal(h.db.adds.length, 0);
    assert.equal(h.scheduled.length, 0);
    // Even with garbage alongside it, the bot still gets a 200.
    const res2 = await handleSignup(req({ kind: "blog", email: "nope", hp: "x", junk: 1 }), h.deps);
    assert.equal(res2.status, 200);
    assert.equal(h.db.docs.size, 0);
  });

  await test("empty honeypot is ignored", async () => {
    const h = harness();
    const res = await handleSignup(req({ ...DEMO, hp: "" }), h.deps);
    assert.equal(res.status, 200);
    assert.equal(h.db.adds.length, 1);
  });

  await test("rate limit: 429 with Retry-After once the per-IP budget is spent", async () => {
    const h = harness({ limit: 2 });
    assert.equal((await handleSignup(req(BLOG), h.deps)).status, 200);
    assert.equal((await handleSignup(req({ ...BLOG, email: "b@c.co" }), h.deps)).status, 200);
    const third = await handleSignup(req({ ...BLOG, email: "c@d.co" }), h.deps);
    assert.equal(third.status, 429);
    assert.deepEqual(third.body, { ok: false, error: "rate_limited" });
    assert.equal(third.headers?.["Retry-After"], "60");
    assert.equal(h.db.docs.size, 2);
    // A different IP has its own budget.
    assert.equal((await handleSignup(req({ ...BLOG, email: "d@e.co" }, { ip: "198.51.100.1" }), h.deps)).status, 200);
  });

  await test("rate limiter window resets", () => {
    let t = 0;
    const rl = createRateLimiter({ limit: 1, windowMs: 1000, now: () => t });
    assert.equal(rl.check("a").allowed, true);
    const blocked = rl.check("a");
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.retryAfterSeconds, 1);
    t = 1000;
    assert.equal(rl.check("a").allowed, true);
  });

  await test("rate limiter memory is bounded", () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 1000, now: () => 0, maxKeys: 3 });
    for (let i = 0; i < 50; i++) rl.check(`ip${i}`);
    // No assertion on internals beyond "didn't blow up"; the newest key still counts.
    assert.equal(rl.check("ip49").allowed, false);
  });

  await test("client IP comes from the first x-forwarded-for entry", () => {
    const h = (m: Record<string, string>) => (n: string) => m[n] ?? null;
    assert.equal(clientIpFromHeaders(h({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" })), "203.0.113.9");
    assert.equal(clientIpFromHeaders(h({ "x-real-ip": "198.51.100.4" })), "198.51.100.4");
    assert.equal(clientIpFromHeaders(h({})), "unknown");
  });

  await test("SES not configured -> still saved and 200, logs 'email skipped (no SES config)'", async () => {
    const h = harness({ ses: false });
    const res = await handleSignup(req(DEMO), h.deps);
    assert.equal(res.status, 200);
    assert.equal(h.db.adds.length, 1);
    assert.equal(h.scheduled.length, 0);
    assert.ok(h.logs.some((l) => l.includes("email skipped (no SES config)")), h.logs.join("\n"));
  });

  await test("SES send failure is logged, never surfaced", async () => {
    const h = harness({ sendFails: true });
    const res = await handleSignup(req(DEMO), h.deps);
    assert.equal(res.status, 200);
    await h.runScheduled(); // must not throw
    assert.ok(h.logs.some((l) => l.startsWith("error [signup] notification email failed: SESError")));
  });

  await test("readSesConfig: needs both keys; defaults from/to/region; rejects header-breaking addresses", () => {
    assert.equal(readSesConfig({}), null);
    assert.equal(readSesConfig({ AWS_SES_ACCESS_KEY_ID: "AKIDEXAMPLE" }), null);
    const cfg = readSesConfig({ AWS_SES_ACCESS_KEY_ID: "AKIDEXAMPLE", AWS_SES_SECRET_ACCESS_KEY: "fake-secret" });
    assert.deepEqual(cfg && { region: cfg.region, from: cfg.from, to: cfg.to }, {
      region: "us-east-1",
      from: "notifications@papexmail.com",
      to: ["nico@papex.app"],
    });
    const origError = console.error;
    console.error = () => {};
    try {
      assert.equal(
        readSesConfig({
          AWS_SES_ACCESS_KEY_ID: "AKIDEXAMPLE",
          AWS_SES_SECRET_ACCESS_KEY: "fake-secret",
          SIGNUP_NOTIFY_TO: "nico@papex.app\r\nBcc: x@y.z",
        }),
        null
      );
    } finally {
      console.error = origError;
    }
  });

  await test("email subject is fixed per kind; user input only in the body", () => {
    const e = buildNotificationEmail(
      { kind: "blog", email: "evil@example.com", source: "blog-post", path: "/blog/x" },
      new Date("2026-09-24T00:00:00Z")
    );
    assert.equal(e.subject, "PapeX: new blog sign-up");
    assert.match(e.text, /evil@example\.com/);
    assert.match(e.text, /blog-post/);
  });

  await test("non-JSON content type -> 415", async () => {
    const h = harness();
    const res = await handleSignup(req(DEMO, { contentType: "application/x-www-form-urlencoded" }), h.deps);
    assert.equal(res.status, 415);
    assert.equal((await handleSignup(req(DEMO, { contentType: null }), h.deps)).status, 415);
    assert.equal((await handleSignup(req(DEMO, { contentType: "application/json; charset=utf-8" }), h.deps)).status, 200);
  });

  await test("oversized body -> 413; malformed JSON -> 400 invalid_json", async () => {
    const h = harness();
    assert.equal((await handleSignup(req(DEMO, { bodyText: null }), h.deps)).status, 413);
    assert.equal((await handleSignup(req("x".repeat(MAX_SIGNUP_BODY_BYTES + 1)), h.deps)).status, 413);
    const bad = await handleSignup(req("{not json"), h.deps);
    assert.deepEqual(bad, { status: 400, body: { ok: false, error: "invalid_json" }, headers: undefined });
  });

  await test("invalid fields -> 400 with messages, and nothing saved", async () => {
    const h = harness();
    const res = await handleSignup(req({ ...BLOG, email: "not-an-email" }), h.deps);
    assert.equal(res.status, 400);
    assert.deepEqual(res.body, { ok: false, error: "invalid_fields", fields: { email: "Enter a valid email address." } });
    assert.equal(h.db.docs.size, 0);
  });

  await test("storage not configured -> 503 (dev explains, prod is generic); validation still runs first", async () => {
    const prod = harness({ store: "missing" });
    assert.deepEqual((await handleSignup(req(BLOG), prod.deps)).body, { ok: false, error: "unavailable" });
    assert.equal((await handleSignup(req(BLOG), prod.deps)).status, 503);
    assert.equal((await handleSignup(req({ ...BLOG, email: "x" }), prod.deps)).status, 400);
    const dev = harness({ store: "missing", isDev: true });
    const res = await handleSignup(req(BLOG), dev.deps);
    assert.equal(res.status, 503);
    assert.equal(res.body.ok === false && res.body.error, "not_configured");
    assert.match(res.body.ok === false ? (res.body.message ?? "") : "", /PAPEXWEB_SERVICE_ACCOUNT/);
  });

  await test("broken storage config -> 503, logged without leaking to the caller", async () => {
    const h = harness({ store: "broken" });
    const res = await handleSignup(req(DEMO), h.deps);
    assert.deepEqual(res.body, { ok: false, error: "unavailable" });
    assert.ok(h.logs.some((l) => l.includes("storage init failed")));
  });

  await test("a Firestore write failure -> 500 server_error, no internals in the body", async () => {
    const h = harness();
    h.deps.getStore = () => ({
      saveDemoRequest: async () => {
        throw new Error("7 PERMISSION_DENIED: secret internal detail");
      },
      saveBlogSubscriber: async () => ({ created: true }),
    });
    const res = await handleSignup(req(DEMO), h.deps);
    assert.deepEqual(res.body, { ok: false, error: "server_error" });
    assert.ok(!JSON.stringify(res.body).includes("PERMISSION"));
    assert.equal(h.scheduled.length, 0);
  });

  console.log("signup: client helper");

  await test("submitSignup posts JSON to /api/signup and maps responses", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const reply = (status: number, body: unknown, headers: Record<string, string> = {}) =>
      (async (url: string | URL | Request, init?: RequestInit) => {
        calls.push({ url: String(url), init: init ?? {} });
        return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });
      }) as typeof fetch;

    assert.deepEqual(await submitSignup({ kind: "blog", email: "a@b.co", source: "footer" }, { fetchImpl: reply(200, { ok: true }) }), { ok: true });
    assert.equal(calls[0].url, "/api/signup");
    assert.equal(calls[0].init.method, "POST");
    assert.equal((calls[0].init.headers as Record<string, string>)["Content-Type"], "application/json");
    assert.deepEqual(JSON.parse(String(calls[0].init.body)), { kind: "blog", email: "a@b.co", source: "footer" });

    const invalid = await submitSignup(
      { kind: "blog", email: "x", source: "footer" },
      { fetchImpl: reply(400, { ok: false, error: "invalid_fields", fields: { email: "Enter a valid email address." } }) }
    );
    assert.deepEqual(invalid, { ok: false, error: "invalid_fields", fields: { email: "Enter a valid email address." } });

    const limited = await submitSignup(DEMO as never, { fetchImpl: reply(429, { ok: false, error: "rate_limited" }, { "Retry-After": "42" }) });
    assert.deepEqual(limited, { ok: false, error: "rate_limited", retryAfterSeconds: 42 });

    const down = await submitSignup(DEMO as never, {
      fetchImpl: (async () => {
        throw new TypeError("Failed to fetch");
      }) as typeof fetch,
    });
    assert.deepEqual(down, { ok: false, error: "network" });

    const html = await submitSignup(DEMO as never, {
      fetchImpl: (async () => new Response("<html>502</html>", { status: 502 })) as typeof fetch,
    });
    assert.deepEqual(html, { ok: false, error: "server_error" });
  });

  console.log(`\nsignup: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

void main();
