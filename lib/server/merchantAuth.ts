// lib/server/merchantAuth.ts
//
// SERVER ONLY. Who is calling a /api/merchant/* route.
//
// Identity comes ONLY from the `Authorization: Bearer <Firebase ID token>`
// header, never from the body or query. Tokens are dashboard logins of the
// papexweb-aed97 project (see lib/firebaseMerchantAuth.ts), verified here
// with jose against Google's securetoken JWKS: RS256 only, exact issuer and
// audience, exp/iat/sub checked.
//
// Admin = PapeX staff. The signed-in email must be in MERCHANT_ADMIN_EMAILS
// (comma separated, default nico@papex.app) AND the token must say
// email_verified. The verified check exists because email/password accounts
// can be created for an address nobody proved they own; set
// MERCHANT_ADMIN_REQUIRE_VERIFIED=0 to drop it if a staff login is unverified.
//
// MOCK MODE (NEXT_PUBLIC_MERCHANT_MOCK=1 and NODE_ENV !== "production", the
// same double gate as app/merchant/AuthContext.tsx): the mock AuthContext
// sends the literal token "mock-id-token". Any non-empty bearer is accepted
// and mapped to the fixed demo identity below. Admin in mock mode only when
// MERCHANT_MOCK_ADMIN=1 or the request carries `x-merchant-mock-role: admin`
// (`x-merchant-mock-role: merchant` forces the merchant view).

import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import { isMerchantMockMode } from "./merchantData";

export const MERCHANT_FIREBASE_PROJECT_ID = "papexweb-aed97";
export const MERCHANT_TOKEN_ISSUER = `https://securetoken.google.com/${MERCHANT_FIREBASE_PROJECT_ID}`;
const JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const DEFAULT_ADMIN_EMAILS = ["nico@papex.app"];
/** Clock skew tolerated on iat / auth_time. */
const CLOCK_TOLERANCE_S = 300;

export const MOCK_IDENTITY = { uid: "mock-merchant", email: "demo@doobienights.com" } as const;

export interface MerchantIdentity {
  uid: string;
  /** Lowercased. May be "" for a token without an email claim. */
  email: string;
  isAdmin: boolean;
}

// ── Key set (injectable for tests) ───────────────────────────────────────

let keySetOverride: JWTVerifyGetKey | null = null;
let remoteKeySet: JWTVerifyGetKey | null = null;

/** Tests only: swap Google's JWKS for a local one. Pass null to restore. */
export function setMerchantAuthKeySetForTests(keySet: JWTVerifyGetKey | null): void {
  keySetOverride = keySet;
}

function getKeySet(): JWTVerifyGetKey {
  if (keySetOverride) return keySetOverride;
  remoteKeySet ??= createRemoteJWKSet(new URL(JWKS_URL), { cacheMaxAge: 6 * 60 * 60 * 1000 });
  return remoteKeySet;
}

// ── Admin list ───────────────────────────────────────────────────────────

export function getAdminEmails(): string[] {
  const raw = process.env.MERCHANT_ADMIN_EMAILS;
  const list = (raw ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.length > 0 ? list : DEFAULT_ADMIN_EMAILS;
}

function isAdminClaims(email: string, emailVerified: boolean): boolean {
  if (!email || !getAdminEmails().includes(email)) return false;
  if (process.env.MERCHANT_ADMIN_REQUIRE_VERIFIED === "0") return true;
  return emailVerified;
}

// ── Verification ─────────────────────────────────────────────────────────

export class MerchantAuthError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "MerchantAuthError";
  }
}

export interface VerifyOptions {
  keySet?: JWTVerifyGetKey;
  /** Tests: evaluate exp/iat against this clock. */
  currentDate?: Date;
}

/** Verifies a papexweb-aed97 Firebase ID token. Throws MerchantAuthError. */
export async function verifyMerchantIdToken(token: string, opts: VerifyOptions = {}): Promise<MerchantIdentity> {
  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(token, opts.keySet ?? getKeySet(), {
      algorithms: ["RS256"],
      issuer: MERCHANT_TOKEN_ISSUER,
      audience: MERCHANT_FIREBASE_PROJECT_ID,
      currentDate: opts.currentDate,
      requiredClaims: ["exp", "iat", "sub"],
    }));
  } catch {
    throw new MerchantAuthError("invalid_token");
  }
  const nowS = Math.floor((opts.currentDate ?? new Date()).getTime() / 1000);
  if (typeof payload.sub !== "string" || payload.sub.length === 0 || payload.sub.length > 128) {
    throw new MerchantAuthError("invalid_token");
  }
  if (typeof payload.iat !== "number" || payload.iat > nowS + CLOCK_TOLERANCE_S) {
    throw new MerchantAuthError("invalid_token");
  }
  const authTime = (payload as { auth_time?: unknown }).auth_time;
  if (authTime !== undefined && (typeof authTime !== "number" || authTime > nowS + CLOCK_TOLERANCE_S)) {
    throw new MerchantAuthError("invalid_token");
  }
  const rawEmail = (payload as { email?: unknown }).email;
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  const emailVerified = (payload as { email_verified?: unknown }).email_verified === true;
  return { uid: payload.sub, email, isAdmin: isAdminClaims(email, emailVerified) };
}

function bearerToken(req: NextRequest): string | null {
  const h = req.headers.get("authorization");
  if (!h) return null;
  const m = /^Bearer\s+(\S+)\s*$/i.exec(h);
  return m ? m[1] : null;
}

function mockIsAdmin(req: NextRequest): boolean {
  const role = req.headers.get("x-merchant-mock-role")?.trim().toLowerCase();
  if (role === "admin") return true;
  if (role === "merchant") return false;
  return process.env.MERCHANT_MOCK_ADMIN === "1";
}

// ── Route helpers ────────────────────────────────────────────────────────

export function jsonError(status: number, error: string, message?: string): NextResponse {
  return NextResponse.json(message ? { error, message } : { error }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/** The caller's identity, or a 401 response. */
export async function requireMerchant(req: NextRequest): Promise<MerchantIdentity | NextResponse> {
  const token = bearerToken(req);
  if (!token) return jsonError(401, "unauthorized", "Sign in to continue.");
  if (isMerchantMockMode()) {
    return { uid: MOCK_IDENTITY.uid, email: MOCK_IDENTITY.email, isAdmin: mockIsAdmin(req) };
  }
  try {
    const who = await verifyMerchantIdToken(token);
    if (!who.email) return jsonError(401, "unauthorized", "This login has no email address.");
    return who;
  } catch {
    return jsonError(401, "unauthorized", "Your session expired. Sign in again.");
  }
}

/** The caller's identity if they are PapeX staff, else a 401/403 response. */
export async function requireAdmin(req: NextRequest): Promise<MerchantIdentity | NextResponse> {
  const who = await requireMerchant(req);
  if (who instanceof NextResponse) return who;
  if (!who.isAdmin) return jsonError(403, "forbidden", "Only PapeX staff can do this.");
  return who;
}
