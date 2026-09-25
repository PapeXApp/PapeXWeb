// components/blog/image.ts
//
// Where a post image may come from, and whether next/image may optimise it.
//
// The crash this fixes: post images are whatever the CMS stored — an ImgBB
// URL, a Vercel Blob URL, a local /blog/*.png, a base64 data: URL, or ANY
// https URL an admin pasted (blogServiceFree accepts any `isUrlImage`). The
// old pages handed every https URL to next/image, which throws "hostname is
// not configured under images" for a host missing from next.config.ts
// `images.remotePatterns`, taking the whole page down.
//
// Now: hosts that ARE in remotePatterns get optimised; everything else is
// rendered `unoptimized` (next/image then never calls the loader, so the
// allowlist is never consulted). Keep OPTIMIZED_HOSTS in step with
// next.config.ts — a host listed here but not there would crash again.

export const DEFAULT_POST_IMAGE = '/blog/blog_image.png'
export const SITE_ORIGIN = 'https://papex.app'
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image-v3.png`

// Mirrors next.config.ts images.remotePatterns (read-only here).
const OPTIMIZED_HOSTS: readonly RegExp[] = [
  /^i\.ibb\.co$/,
  /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/,
  /^media\.licdn\.com$/,
]

export type ResolvedImage = { src: string; optimize: boolean }

export function resolvePostImage(raw: string | null | undefined): ResolvedImage {
  const value = (raw ?? '').trim()
  if (!value) return { src: DEFAULT_POST_IMAGE, optimize: true }
  if (value.startsWith('data:image/')) return { src: value, optimize: false }
  // Site-relative path (but not protocol-relative //host).
  if (value.startsWith('/') && !value.startsWith('//')) return { src: value, optimize: true }
  if (value.startsWith('https://')) {
    try {
      const { hostname } = new URL(value)
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return { src: DEFAULT_POST_IMAGE, optimize: true }
      }
      return { src: value, optimize: OPTIMIZED_HOSTS.some((re) => re.test(hostname)) }
    } catch {
      return { src: DEFAULT_POST_IMAGE, optimize: true }
    }
  }
  // http:// (mixed content on papex.app), localhost, or anything unrecognised.
  return { src: DEFAULT_POST_IMAGE, optimize: true }
}

/** Absolute URL for Open Graph / Twitter / JSON-LD. Crawlers can't use a
 *  data: URL, so base64 images fall back to the site's default card. */
export function socialImageUrl(raw: string | null | undefined): string {
  const { src } = resolvePostImage(raw)
  if (src.startsWith('data:')) return DEFAULT_OG_IMAGE
  if (src.startsWith('/')) return `${SITE_ORIGIN}${src}`
  return src
}
