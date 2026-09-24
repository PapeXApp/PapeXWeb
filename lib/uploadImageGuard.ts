/**
 * Server-side checks for /api/upload-image.
 *
 * The route writes PUBLIC blobs to PapeX's *.public.blob.vercel-storage.com,
 * so everything the caller controls is checked here:
 *   - who: a verified Firebase ID token for a blog admin (lib/adminEmails.ts)
 *   - what: the bytes must sniff as a raster image; the stored content type
 *     and extension come from the sniff, never from the client
 *   - how big: MAX_UPLOAD_BYTES
 *   - where: always under blog-images/, client path segments are discarded
 *
 * Pure functions (no Next/@vercel/blob imports) so lib/uploadImageGuard.test.ts
 * can exercise them under plain `tsx`.
 */

import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose'
import { isAdminEmail } from './adminEmails'

// Must match projectId in firebase/firebaseConfig.ts (asserted by the test).
export const FIREBASE_PROJECT_ID = 'papexweb-aed97'

const FIREBASE_ISSUER = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`
const FIREBASE_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'

// Vercel functions reject request bodies over 4.5 MB; the client compresses to
// ~0.5 MB, so 4 MB leaves headroom for a failed compression.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024

export const BLOB_PREFIX = 'blog-images/'

// Cached across invocations of a warm function; jose handles key rotation.
let firebaseKeys: JWTVerifyGetKey | undefined
function getFirebaseKeys(): JWTVerifyGetKey {
  firebaseKeys ??= createRemoteJWKSet(new URL(FIREBASE_JWKS_URL))
  return firebaseKeys
}

export type AdminAuthResult =
  | { ok: true; uid: string; email: string }
  | { ok: false; status: 401 | 403; error: string }

/**
 * Verifies `Authorization: Bearer <Firebase ID token>` and requires a blog
 * admin with a verified email. Follows Firebase's documented checks for
 * verifying ID tokens without the Admin SDK: RS256, Google securetoken key,
 * aud = project id, iss = securetoken.google.com/<project id>, unexpired,
 * non-empty sub, auth_time in the past.
 *
 * `getKey` / `currentDate` are injectable for tests only.
 */
export async function verifyAdminRequest(
  authorization: string | null | undefined,
  opts: { getKey?: JWTVerifyGetKey; currentDate?: Date } = {},
): Promise<AdminAuthResult> {
  const match = /^Bearer\s+(\S+)$/i.exec(authorization?.trim() ?? '')
  if (!match) {
    return { ok: false, status: 401, error: 'Missing bearer token' }
  }

  let payload
  try {
    ;({ payload } = await jwtVerify(match[1], opts.getKey ?? getFirebaseKeys(), {
      algorithms: ['RS256'],
      audience: FIREBASE_PROJECT_ID,
      issuer: FIREBASE_ISSUER,
      requiredClaims: ['exp', 'iat', 'sub', 'auth_time'],
      currentDate: opts.currentDate,
      clockTolerance: 5,
    }))
  } catch {
    return { ok: false, status: 401, error: 'Invalid or expired token' }
  }

  const nowSec = Math.floor((opts.currentDate ?? new Date()).getTime() / 1000)
  const authTime = payload.auth_time
  if (
    typeof payload.sub !== 'string' || payload.sub.length === 0 ||
    typeof payload.iat !== 'number' || payload.iat > nowSec + 5 ||
    typeof authTime !== 'number' || authTime > nowSec + 5
  ) {
    return { ok: false, status: 401, error: 'Invalid or expired token' }
  }

  const email = typeof payload.email === 'string' ? payload.email : ''
  if (!isAdminEmail(email)) {
    return { ok: false, status: 403, error: 'Not an admin' }
  }
  // The allowlist is public; an unverified address could be anyone who signed
  // up with it first.
  if (payload.email_verified !== true) {
    return { ok: false, status: 403, error: 'Admin email is not verified' }
  }

  return { ok: true, uid: payload.sub, email }
}

export type ImageType = { contentType: string; ext: string }

/**
 * Identifies the image from its magic bytes. Only raster formats: SVG is
 * deliberately excluded (it can carry script), and the client-declared
 * File.type is never trusted.
 */
export function sniffImageType(bytes: Uint8Array): ImageType | null {
  const at = (i: number, sig: number[]) =>
    bytes.length >= i + sig.length && sig.every((b, j) => bytes[i + j] === b)

  if (at(0, [0xff, 0xd8, 0xff])) return { contentType: 'image/jpeg', ext: 'jpg' }
  if (at(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { contentType: 'image/png', ext: 'png' }
  }
  if (at(0, [0x47, 0x49, 0x46, 0x38]) && (at(4, [0x37, 0x61]) || at(4, [0x39, 0x61]))) {
    return { contentType: 'image/gif', ext: 'gif' }
  }
  if (at(0, [0x52, 0x49, 0x46, 0x46]) && at(8, [0x57, 0x45, 0x42, 0x50])) {
    return { contentType: 'image/webp', ext: 'webp' }
  }
  return null
}

/**
 * Builds the blob pathname. The client's name is reduced to a short, safe
 * base name (no directories, no extension) purely for readability; the
 * prefix and extension are fixed by the server.
 */
export function buildBlobPathname(
  requestedName: string | null | undefined,
  image: ImageType,
  now: number = Date.now(),
): string {
  const lastSegment = (requestedName ?? '').split(/[\\/]/).pop() ?? ''
  const withoutExt = lastSegment.replace(/\.[^.]*$/, '')
  // Drop a leading "<timestamp>-" the client may already have added.
  const base = withoutExt
    .replace(/^\d{10,}-/, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^[_-]+|[_-]+$/g, '')
    .slice(0, 80)
  return `${BLOB_PREFIX}${now}-${base || 'image'}.${image.ext}`
}
