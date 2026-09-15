/**
 * Blog/CMS admin allowlist, shared by the client gate (hooks/useAdmin.ts) and
 * the server check on /api/upload-image (lib/blogUploadAuth.ts).
 *
 * BLOG_ADMIN_EMAILS are trusted server-side (with email_verified required).
 * LEGACY_PLACEHOLDER_ADMIN_EMAILS are old placeholder gmail addresses nobody at
 * PapeX owns: anyone who owns those inboxes could sign up and verify, so they
 * only keep the (cosmetic) client UI gate as it was and are NEVER trusted by
 * the server.
 */

export const BLOG_ADMIN_EMAILS: readonly string[] = [
  'admin@papex.app',
  'nicolas@papex.app',
  'michael@papex.app',
  'nico@papex.app',
  'raasinr@gmail.com',
  'nico.courbage@gmail.com',
  'mike@series-zero.com',
  'michael_khoury@icloud.com',
  'krutartha2002@gmail.com',
  'test@papex.app',
]

export const LEGACY_PLACEHOLDER_ADMIN_EMAILS: readonly string[] = [
  'admin@gmail.com',
  'nicolas@gmail.com',
  'michael@gmail.com',
]
