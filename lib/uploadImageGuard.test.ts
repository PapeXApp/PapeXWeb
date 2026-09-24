// lib/uploadImageGuard.test.ts
//
// Standalone test script for the /api/upload-image guards (no test framework
// in this repo — see package.json). Run with:
//   npm run test:uploadGuard
// (uses `tsx`, same pattern as lib/escpos.test.ts / lib/merchantHost.test.ts.)
//
// Tokens are signed with a locally generated RSA key and verified against a
// local JWKS, so the Firebase claim checks run offline with no network.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair, type JWTPayload } from "jose";
import { ADMIN_EMAILS, isAdminEmail } from "./adminEmails";
import {
  BLOB_PREFIX,
  FIREBASE_PROJECT_ID,
  buildBlobPathname,
  sniffImageType,
  verifyAdminRequest,
} from "./uploadImageGuard";

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok - ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL - ${name}`);
    console.error(err instanceof Error ? err.message : err);
  }
}

const ISSUER = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
const NOW = new Date("2026-09-23T12:00:00Z");
const NOW_SEC = Math.floor(NOW.getTime() / 1000);
const ADMIN = "nicolas@papex.app";

async function main() {
  const good = await generateKeyPair("RS256");
  const rogue = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(good.publicKey)), kid: "k1", alg: "RS256", use: "sig" };
  const getKey = createLocalJWKSet({ keys: [jwk] });

  const claims = (over: JWTPayload = {}): JWTPayload => ({
    iss: ISSUER,
    aud: FIREBASE_PROJECT_ID,
    sub: "uid-123",
    iat: NOW_SEC - 60,
    exp: NOW_SEC + 3600,
    auth_time: NOW_SEC - 120,
    email: ADMIN,
    email_verified: true,
    ...over,
  });

  const sign = (payload: JWTPayload, key = good.privateKey, kid = "k1") =>
    new SignJWT(payload).setProtectedHeader({ alg: "RS256", kid, typ: "JWT" }).sign(key);

  const verify = (header: string | null) =>
    verifyAdminRequest(header, { getKey, currentDate: NOW });

  const expectReject = async (header: string | null, status: 401 | 403) => {
    const r = await verify(header);
    assert.equal(r.ok, false, "expected rejection");
    if (!r.ok) assert.equal(r.status, status);
  };

  // ---- verifyAdminRequest: accept -------------------------------------------

  await test("accepts a verified admin with a valid token", async () => {
    const r = await verify(`Bearer ${await sign(claims())}`);
    assert.deepEqual(r, { ok: true, uid: "uid-123", email: ADMIN });
  });

  await test("accepts a lowercase 'bearer' scheme", async () => {
    const r = await verify(`bearer ${await sign(claims())}`);
    assert.equal(r.ok, true);
  });

  // ---- verifyAdminRequest: 401 (who are you?) --------------------------------

  await test("401 with no Authorization header", () => expectReject(null, 401));
  await test("401 with an empty header", () => expectReject("", 401));
  await test("401 with a non-bearer scheme", async () => {
    await expectReject(`Basic ${await sign(claims())}`, 401);
  });
  await test("401 with garbage instead of a JWT", () => expectReject("Bearer not.a.jwt", 401));

  await test("401 when signed by a key not in the JWKS", async () => {
    await expectReject(`Bearer ${await sign(claims(), rogue.privateKey)}`, 401);
  });

  await test("401 when signed by an unknown key id", async () => {
    await expectReject(`Bearer ${await sign(claims(), rogue.privateKey, "k2")}`, 401);
  });

  await test("401 on an HS256 token (algorithm confusion)", async () => {
    const hs = await new SignJWT(claims())
      .setProtectedHeader({ alg: "HS256", kid: "k1" })
      .sign(new TextEncoder().encode("x".repeat(32)));
    await expectReject(`Bearer ${hs}`, 401);
  });

  await test("401 on an unsigned (alg=none) token", async () => {
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
    await expectReject(`Bearer ${b64({ alg: "none", kid: "k1" })}.${b64(claims())}.`, 401);
  });

  await test("401 when aud is another Firebase project", async () => {
    await expectReject(`Bearer ${await sign(claims({ aud: "papexv2" }))}`, 401);
  });

  await test("401 when iss is another Firebase project", async () => {
    await expectReject(
      `Bearer ${await sign(claims({ iss: "https://securetoken.google.com/papexv2" }))}`,
      401,
    );
  });

  await test("401 when the token has expired", async () => {
    await expectReject(`Bearer ${await sign(claims({ exp: NOW_SEC - 60 }))}`, 401);
  });

  await test("401 when iat is in the future", async () => {
    await expectReject(`Bearer ${await sign(claims({ iat: NOW_SEC + 600 }))}`, 401);
  });

  await test("401 when auth_time is in the future", async () => {
    await expectReject(`Bearer ${await sign(claims({ auth_time: NOW_SEC + 600 }))}`, 401);
  });

  await test("401 when auth_time is missing", async () => {
    await expectReject(`Bearer ${await sign(claims({ auth_time: undefined }))}`, 401);
  });

  await test("401 when sub is empty", async () => {
    await expectReject(`Bearer ${await sign(claims({ sub: "" }))}`, 401);
  });

  // ---- verifyAdminRequest: 403 (not allowed) ---------------------------------

  await test("403 for a signed-in user who is not an admin", async () => {
    await expectReject(`Bearer ${await sign(claims({ email: "someone@example.com" }))}`, 403);
  });

  await test("403 for a token with no email (e.g. anonymous / phone auth)", async () => {
    await expectReject(`Bearer ${await sign(claims({ email: undefined }))}`, 403);
  });

  await test("403 for an allowlisted email that is NOT verified", async () => {
    // The allowlist is public: anyone can sign up with an unclaimed entry.
    await expectReject(`Bearer ${await sign(claims({ email_verified: false }))}`, 403);
  });

  await test("403 when email_verified is missing", async () => {
    await expectReject(`Bearer ${await sign(claims({ email_verified: undefined }))}`, 403);
  });

  await test("403 when email_verified is the string 'true'", async () => {
    await expectReject(`Bearer ${await sign(claims({ email_verified: "true" }))}`, 403);
  });

  // ---- admin allowlist --------------------------------------------------------

  await test("isAdminEmail: matches the allowlist case-insensitively", () => {
    assert.equal(isAdminEmail("Nicolas@PapeX.app"), true);
    assert.equal(isAdminEmail(" nicolas@papex.app "), true);
  });

  await test("isAdminEmail: rejects lookalikes and empties", () => {
    assert.equal(isAdminEmail("nicolas@papex.app.evil.com"), false);
    assert.equal(isAdminEmail("xnicolas@papex.app"), false);
    assert.equal(isAdminEmail(""), false);
    assert.equal(isAdminEmail(null), false);
  });

  await test("ADMIN_EMAILS entries are lowercase (the match lowercases input)", () => {
    for (const e of ADMIN_EMAILS) assert.equal(e, e.trim().toLowerCase());
  });

  await test("FIREBASE_PROJECT_ID matches firebase/firebaseConfig.ts", () => {
    const src = readFileSync(join(__dirname, "..", "firebase", "firebaseConfig.ts"), "utf8");
    const m = /projectId:\s*["']([^"']+)["']/.exec(src);
    assert.ok(m, "projectId not found in firebaseConfig.ts");
    assert.equal(m[1], FIREBASE_PROJECT_ID);
  });

  // ---- sniffImageType ---------------------------------------------------------

  const bytes = (...parts: (number[] | string)[]) =>
    new Uint8Array(parts.flatMap((p) => (typeof p === "string" ? [...Buffer.from(p)] : p)));

  await test("sniff: JPEG", () => {
    assert.deepEqual(sniffImageType(bytes([0xff, 0xd8, 0xff, 0xe0, 0, 0x10])), {
      contentType: "image/jpeg",
      ext: "jpg",
    });
  });

  await test("sniff: PNG", () => {
    const png = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d]);
    assert.deepEqual(sniffImageType(png), { contentType: "image/png", ext: "png" });
  });

  await test("sniff: GIF87a and GIF89a", () => {
    assert.equal(sniffImageType(bytes("GIF87a", [1, 0]))?.contentType, "image/gif");
    assert.equal(sniffImageType(bytes("GIF89a", [1, 0]))?.contentType, "image/gif");
  });

  await test("sniff: WebP", () => {
    const webp = bytes("RIFF", [0x24, 0, 0, 0], "WEBPVP8 ");
    assert.deepEqual(sniffImageType(webp), { contentType: "image/webp", ext: "webp" });
  });

  await test("sniff: rejects HTML (the phishing case)", () => {
    assert.equal(sniffImageType(bytes("<!DOCTYPE html><html>")), null);
  });

  await test("sniff: rejects SVG (can carry script)", () => {
    assert.equal(sniffImageType(bytes('<svg xmlns="http://www.w3.org/2000/svg">')), null);
    assert.equal(sniffImageType(bytes('<?xml version="1.0"?><svg>')), null);
  });

  await test("sniff: rejects a Windows executable", () => {
    assert.equal(sniffImageType(bytes("MZ", [0x90, 0, 3, 0])), null);
  });

  await test("sniff: rejects a non-WebP RIFF (e.g. WAV)", () => {
    assert.equal(sniffImageType(bytes("RIFF", [0x24, 0, 0, 0], "WAVEfmt ")), null);
  });

  await test("sniff: rejects empty and truncated input", () => {
    assert.equal(sniffImageType(new Uint8Array()), null);
    assert.equal(sniffImageType(bytes([0xff, 0xd8])), null);
    assert.equal(sniffImageType(bytes([0x89, 0x50, 0x4e, 0x47])), null);
  });

  // ---- buildBlobPathname ------------------------------------------------------

  const PNG = { contentType: "image/png", ext: "png" };
  const T = 1758628800000;

  await test("pathname: normal client name keeps a readable base", () => {
    assert.equal(buildBlobPathname("My_Photo.jpg", PNG, T), `${BLOB_PREFIX}${T}-My_Photo.png`);
  });

  await test("pathname: extension always comes from the sniffed type", () => {
    assert.equal(buildBlobPathname("page.html", PNG, T), `${BLOB_PREFIX}${T}-page.png`);
    assert.equal(buildBlobPathname("x.svg", PNG, T), `${BLOB_PREFIX}${T}-x.png`);
  });

  await test("pathname: directory traversal and foreign prefixes are discarded", () => {
    assert.equal(buildBlobPathname("../../evil.html", PNG, T), `${BLOB_PREFIX}${T}-evil.png`);
    assert.equal(buildBlobPathname("merchant/logos/a.png", PNG, T), `${BLOB_PREFIX}${T}-a.png`);
    assert.equal(buildBlobPathname("..\\..\\b.png", PNG, T), `${BLOB_PREFIX}${T}-b.png`);
  });

  await test("pathname: legacy client format (prefix + timestamp) is not doubled", () => {
    assert.equal(
      buildBlobPathname("blog-images/1700000000000-cover.jpg", PNG, T),
      `${BLOB_PREFIX}${T}-cover.png`,
    );
  });

  await test("pathname: unsafe characters are replaced", () => {
    assert.equal(
      buildBlobPathname("a b?c#d%e<f>.jpg", PNG, T),
      `${BLOB_PREFIX}${T}-a_b_c_d_e_f.png`,
    );
  });

  await test("pathname: missing or all-junk names fall back to 'image'", () => {
    assert.equal(buildBlobPathname(null, PNG, T), `${BLOB_PREFIX}${T}-image.png`);
    assert.equal(buildBlobPathname("", PNG, T), `${BLOB_PREFIX}${T}-image.png`);
    assert.equal(buildBlobPathname("../", PNG, T), `${BLOB_PREFIX}${T}-image.png`);
    assert.equal(buildBlobPathname("???.jpg", PNG, T), `${BLOB_PREFIX}${T}-image.png`);
  });

  await test("pathname: very long names are capped", () => {
    const p = buildBlobPathname("a".repeat(500) + ".jpg", PNG, T);
    assert.equal(p, `${BLOB_PREFIX}${T}-${"a".repeat(80)}.png`);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
