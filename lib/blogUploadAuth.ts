/**
 * SERVER ONLY. Who may upload to Vercel Blob via /api/upload-image.
 *
 * The caller sends `Authorization: Bearer <Firebase ID token>` for the
 * papexweb-aed97 project (the blog admin login, hooks/useAdmin.ts). We verify
 * it here with node:crypto against Google's securetoken x509 certs, per
 * https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
 * — RS256 only, known kid, exact aud/iss, exp/iat/auth_time/sub checked.
 * No service account and no extra npm dependency needed.
 *
 * Authorised = email in BLOG_ADMIN_EMAILS (lib/adminEmails.ts) or the
 * comma-separated BLOG_UPLOAD_ADMIN_EMAILS env override, AND email_verified.
 * Set BLOG_UPLOAD_REQUIRE_VERIFIED=0 to drop the verified check if a staff
 * email/password login was never verified.
 */

import { createPublicKey, verify as verifySignature, type KeyObject } from 'node:crypto'
import { BLOG_ADMIN_EMAILS } from './adminEmails'

export const BLOG_FIREBASE_PROJECT_ID = 'papexweb-aed97'
const ISSUER = `https://securetoken.google.com/${BLOG_FIREBASE_PROJECT_ID}`
const CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
const CLOCK_TOLERANCE_S = 300
const DEFAULT_CERT_TTL_MS = 60 * 60 * 1000

export class BlogUploadAuthError extends Error {
  constructor(public readonly status: 401 | 403, message: string) {
    super(message)
    this.name = 'BlogUploadAuthError'
  }
}

// ── Google signing certs (cached per Cache-Control max-age) ─────────────

let certCache: { keys: Map<string, KeyObject>; expiresAt: number } | null = null

async function getSigningKey(kid: string): Promise<KeyObject | undefined> {
  if (!certCache || Date.now() >= certCache.expiresAt || !certCache.keys.has(kid)) {
    const res = await fetch(CERTS_URL, { cache: 'no-store' })
    if (!res.ok) throw new Error(`cert fetch failed: ${res.status}`)
    const pems = (await res.json()) as Record<string, string>
    const keys = new Map<string, KeyObject>()
    for (const [id, pem] of Object.entries(pems)) keys.set(id, createPublicKey(pem))
    const maxAge = /max-age=(\d+)/.exec(res.headers.get('cache-control') ?? '')
    const ttl = maxAge ? Number(maxAge[1]) * 1000 : DEFAULT_CERT_TTL_MS
    certCache = { keys, expiresAt: Date.now() + ttl }
  }
  return certCache.keys.get(kid)
}

function decodeSegment(seg: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(Buffer.from(seg, 'base64url').toString('utf8'))
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('bad segment')
  return parsed as Record<string, unknown>
}

// ── Verification ────────────────────────────────────────────────────────

export interface BlogUploader {
  uid: string
  email: string
}

async function verifyIdToken(token: string): Promise<{ uid: string; email: string; emailVerified: boolean }> {
  const invalid = new BlogUploadAuthError(401, 'Your session expired. Sign in again.')
  const parts = token.split('.')
  if (parts.length !== 3) throw invalid

  let header: Record<string, unknown>
  let payload: Record<string, unknown>
  try {
    header = decodeSegment(parts[0])
    payload = decodeSegment(parts[1])
  } catch {
    throw invalid
  }
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') throw invalid

  let key: KeyObject | undefined
  try {
    key = await getSigningKey(header.kid)
  } catch (error) {
    console.error('upload-image: could not load Google signing certs', error)
    throw invalid
  }
  if (!key) throw invalid

  const signed = Buffer.from(`${parts[0]}.${parts[1]}`)
  const signature = Buffer.from(parts[2], 'base64url')
  if (!verifySignature('RSA-SHA256', signed, key, signature)) throw invalid

  const now = Math.floor(Date.now() / 1000)
  const { aud, iss, sub, exp, iat, auth_time: authTime, email, email_verified: emailVerified } = payload
  if (aud !== BLOG_FIREBASE_PROJECT_ID || iss !== ISSUER) throw invalid
  if (typeof sub !== 'string' || sub.length === 0 || sub.length > 128) throw invalid
  if (typeof exp !== 'number' || exp <= now) throw invalid
  if (typeof iat !== 'number' || iat > now + CLOCK_TOLERANCE_S) throw invalid
  if (typeof authTime !== 'number' || authTime > now + CLOCK_TOLERANCE_S) throw invalid

  return {
    uid: sub,
    email: typeof email === 'string' ? email.trim().toLowerCase() : '',
    emailVerified: emailVerified === true,
  }
}

function allowedEmails(): string[] {
  const fromEnv = (process.env.BLOG_UPLOAD_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return fromEnv.length > 0 ? fromEnv : BLOG_ADMIN_EMAILS.map((e) => e.toLowerCase())
}

/** Resolves to the verified blog admin, or throws BlogUploadAuthError (401/403). */
export async function requireBlogUploader(authorization: string | null): Promise<BlogUploader> {
  const match = authorization ? /^Bearer\s+(\S+)\s*$/i.exec(authorization) : null
  if (!match) throw new BlogUploadAuthError(401, 'Sign in as a blog admin to upload images.')

  const who = await verifyIdToken(match[1])
  if (!who.email || !allowedEmails().includes(who.email)) {
    throw new BlogUploadAuthError(403, 'This account is not allowed to upload images.')
  }
  if (!who.emailVerified && process.env.BLOG_UPLOAD_REQUIRE_VERIFIED !== '0') {
    throw new BlogUploadAuthError(403, 'Verify this account’s email address before uploading images.')
  }
  return { uid: who.uid, email: who.email }
}
