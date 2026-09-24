/**
 * Blog admin allowlist.
 *
 * Single source of truth for BOTH the client-side admin UI gate
 * (hooks/useAdmin.ts) and the server-side check on /api/upload-image
 * (lib/uploadImageGuard.ts), so the two can never drift apart.
 *
 * This file is public (the repo is public). The server therefore only trusts
 * an entry when the Firebase ID token also says `email_verified: true` —
 * otherwise anyone could sign up with an allowlisted address nobody has
 * claimed yet and be treated as an admin.
 */

export const ADMIN_EMAILS: readonly string[] = [
  'admin@papex.app',
  'nicolas@papex.app',
  'michael@papex.app',
  'raasinr@gmail.com', // Your admin email
  'nico.courbage@gmail.com', // Nico's admin email
  'mike@series-zero.com', // Mike's admin email
  'michael_khoury@icloud.com', // Michael Khoury's admin email
  'krutartha2002@gmail.com', // Kru's admin email
  // Add your Firebase auth email here
  'test@papex.app',
  'admin@gmail.com',
  'nicolas@gmail.com',
  'michael@gmail.com',
]

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.trim().toLowerCase())
}
