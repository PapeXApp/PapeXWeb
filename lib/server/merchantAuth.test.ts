// lib/server/merchantAuth.test.ts
//
// Standalone tsx test script for ID-token verification and the route
// guards. Signs tokens with a locally generated RS256 key and injects a local
// JWKS, so it never touches Google. Run with: npm run test:merchantProfile

import assert from "node:assert/strict";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTPayload } from "jose";
import { NextRequest, NextResponse } from "next/server";
import {
  MERCHANT_FIREBASE_PROJECT_ID,
  MERCHANT_TOKEN_ISSUER,
  MerchantAuthError,
  requireAdmin,
  requireMerchant,
  setMerchantAuthKeySetForTests,
  verifyMerchantIdToken,
  type MerchantIdentity,
} from "./merchantAuth";

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok - ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL - ${name}`);
    console.error(err instanceof Error ? err.stack ?? err.message : err);
  }
}

const env = process.env as Record<string, string | undefined>;
function resetEnv() {
  delete env.NEXT_PUBLIC_MERCHANT_MOCK;
  delete env.MERCHANT_MOCK_ADMIN;
  delete env.MERCHANT_ADMIN_EMAILS;
  delete env.MERCHANT_ADMIN_REQUIRE_VERIFIED;
  delete env.PAPEXV2_SERVICE_ACCOUNT;
  env.NODE_ENV = "test";
}

function req(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://merchant.localhost/api/merchant/profile", { headers });
}

async function main() {
  resetEnv();
  const KID = "test-key-1";
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const other = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), kid: KID, alg: "RS256", use: "sig" };
  const keySet = createLocalJWKSet({ keys: [jwk] });
  setMerchantAuthKeySetForTests(keySet);

  async function sign(
    claims: JWTPayload & { email?: string; email_verified?: boolean } = {},
    opts: { iss?: string; aud?: string; sub?: string; exp?: number | string; key?: CryptoKey; kid?: string } = {}
  ): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    return new SignJWT({ email: "owner@doobienights.com", email_verified: true, auth_time: now - 10, ...claims })
      .setProtectedHeader({ alg: "RS256", kid: opts.kid ?? KID })
      .setIssuer(opts.iss ?? MERCHANT_TOKEN_ISSUER)
      .setAudience(opts.aud ?? MERCHANT_FIREBASE_PROJECT_ID)
      .setSubject(opts.sub ?? "uid-123")
      .setIssuedAt(now - 10)
      .setExpirationTime(opts.exp ?? now + 3600)
      .sign(opts.key ?? privateKey);
  }

  async function rejects(token: string) {
    await assert.rejects(verifyMerchantIdToken(token, { keySet }), (e: unknown) => e instanceof MerchantAuthError);
  }

  await test("valid token -> uid + lowercased email, not admin", async () => {
    const who = await verifyMerchantIdToken(await sign({ email: "Owner@DoobieNights.COM" }), { keySet });
    assert.deepEqual(who, { uid: "uid-123", email: "owner@doobienights.com", isAdmin: false });
  });

  await test("wrong audience rejected", async () => rejects(await sign({}, { aud: "papexv2" })));
  await test("wrong issuer rejected", async () => rejects(await sign({}, { iss: "https://securetoken.google.com/papexv2" })));
  await test("expired token rejected", async () => rejects(await sign({}, { exp: Math.floor(Date.now() / 1000) - 60 })));
  await test("empty sub rejected", async () => rejects(await sign({}, { sub: "" })));
  await test("signed by a different key (same kid) rejected", async () => rejects(await sign({}, { key: other.privateKey })));
  await test("unknown kid rejected", async () => rejects(await sign({}, { kid: "other" })));
  await test("iat in the future rejected", async () => {
    const now = Math.floor(Date.now() / 1000);
    const t = await new SignJWT({ email: "a@b.co" })
      .setProtectedHeader({ alg: "RS256", kid: KID })
      .setIssuer(MERCHANT_TOKEN_ISSUER)
      .setAudience(MERCHANT_FIREBASE_PROJECT_ID)
      .setSubject("u")
      .setIssuedAt(now + 3600)
      .setExpirationTime(now + 7200)
      .sign(privateKey);
    await rejects(t);
  });
  await test("HS256 token rejected (algorithm pinned to RS256)", async () => {
    const t = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256", kid: KID })
      .setIssuer(MERCHANT_TOKEN_ISSUER)
      .setAudience(MERCHANT_FIREBASE_PROJECT_ID)
      .setSubject("u")
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("secret-secret-secret-secret-1234"));
    await rejects(t);
  });
  await test("garbage rejected", async () => rejects("not.a.jwt"));

  await test("admin: default list is nico@papex.app (case-insensitive), needs email_verified", async () => {
    resetEnv();
    assert.equal((await verifyMerchantIdToken(await sign({ email: "Nico@PapeX.app" }), { keySet })).isAdmin, true);
    assert.equal((await verifyMerchantIdToken(await sign({ email: "nico@papex.app", email_verified: false }), { keySet })).isAdmin, false);
    env.MERCHANT_ADMIN_REQUIRE_VERIFIED = "0";
    assert.equal((await verifyMerchantIdToken(await sign({ email: "nico@papex.app", email_verified: false }), { keySet })).isAdmin, true);
    resetEnv();
  });

  await test("admin: MERCHANT_ADMIN_EMAILS replaces the default", async () => {
    env.MERCHANT_ADMIN_EMAILS = " ops@papex.app , Second@PapeX.app ";
    assert.equal((await verifyMerchantIdToken(await sign({ email: "second@papex.app" }), { keySet })).isAdmin, true);
    assert.equal((await verifyMerchantIdToken(await sign({ email: "nico@papex.app" }), { keySet })).isAdmin, false);
    resetEnv();
  });

  await test("requireMerchant: 401 without a bearer, identity with a good one", async () => {
    const none = await requireMerchant(req());
    assert.ok(none instanceof NextResponse && none.status === 401);
    const bad = await requireMerchant(req({ authorization: "Bearer nope" }));
    assert.ok(bad instanceof NextResponse && bad.status === 401);
    const who = (await requireMerchant(req({ authorization: `Bearer ${await sign()}` }))) as MerchantIdentity;
    assert.equal(who.uid, "uid-123");
  });

  await test("requireMerchant: identity is never taken from query or mock headers outside mock mode", async () => {
    const r = new NextRequest("http://x/api/merchant/profile?uid=evil&email=nico@papex.app", {
      headers: { authorization: `Bearer ${await sign()}`, "x-merchant-mock-role": "admin" },
    });
    const who = (await requireMerchant(r)) as MerchantIdentity;
    assert.equal(who.email, "owner@doobienights.com");
    assert.equal(who.isAdmin, false);
  });

  await test("requireAdmin: 403 for a merchant, identity for staff", async () => {
    const res = await requireAdmin(req({ authorization: `Bearer ${await sign()}` }));
    assert.ok(res instanceof NextResponse && res.status === 403);
    const staff = await requireAdmin(req({ authorization: `Bearer ${await sign({ email: "nico@papex.app" })}` }));
    assert.ok(!(staff instanceof NextResponse) && staff.isAdmin);
  });

  await test("mock mode: accepts the AuthContext's 'mock-id-token' as the demo merchant", async () => {
    env.NEXT_PUBLIC_MERCHANT_MOCK = "1";
    const who = (await requireMerchant(req({ authorization: "Bearer mock-id-token" }))) as MerchantIdentity;
    assert.deepEqual(who, { uid: "mock-merchant", email: "demo@doobienights.com", isAdmin: false });
    const none = await requireMerchant(req());
    assert.ok(none instanceof NextResponse && none.status === 401, "still needs a bearer");
    resetEnv();
  });

  await test("mock mode: admin via x-merchant-mock-role or MERCHANT_MOCK_ADMIN=1", async () => {
    env.NEXT_PUBLIC_MERCHANT_MOCK = "1";
    const viaHeader = (await requireAdmin(req({ authorization: "Bearer mock-id-token", "x-merchant-mock-role": "admin" }))) as MerchantIdentity;
    assert.equal(viaHeader.isAdmin, true);
    const denied = await requireAdmin(req({ authorization: "Bearer mock-id-token" }));
    assert.ok(denied instanceof NextResponse && denied.status === 403);
    env.MERCHANT_MOCK_ADMIN = "1";
    assert.equal(((await requireMerchant(req({ authorization: "Bearer mock-id-token" }))) as MerchantIdentity).isAdmin, true);
    const forced = (await requireMerchant(req({ authorization: "Bearer mock-id-token", "x-merchant-mock-role": "merchant" }))) as MerchantIdentity;
    assert.equal(forced.isAdmin, false);
    resetEnv();
  });

  await test("mock flag is dead in production: the mock token is then verified for real (and fails)", async () => {
    env.NEXT_PUBLIC_MERCHANT_MOCK = "1";
    env.NODE_ENV = "production";
    const res = await requireMerchant(req({ authorization: "Bearer mock-id-token", "x-merchant-mock-role": "admin" }));
    assert.ok(res instanceof NextResponse && res.status === 401);
    resetEnv();
  });

  setMerchantAuthKeySetForTests(null);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

void main();
