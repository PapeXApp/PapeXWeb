// app/blog/_lib/posts.ts
//
// SERVER-SIDE blog reads for /blog and /blog/[slug].
//
// Why the Firestore REST API and not lib/blogServiceFree.ts: that module is
// the CMS's CLIENT path (Firebase JS SDK + browser-only image compression +
// Firebase Auth, all initialised at import time). Pulling it into a Server
// Component would drag browser code into the server bundle. The blog pages
// only need to READ published posts, and the `blogs` collection is publicly
// readable, so a plain `fetch` against the REST endpoint with the same public
// project id + web API key (firebase/firebaseConfig.ts) is enough, and it
// plays with Next's data cache / ISR. Writes (create/edit) stay on the client
// SDK through CreateBlogModal / EditBlogModal, unchanged.
//
// Keep this file free of client imports so it never ends up in a browser
// bundle. Everything here is read-only.

import { cache } from 'react'

const PROJECT_ID = 'papexweb-aed97'
// Same public web API key as firebase/firebaseConfig.ts (a Firebase web key is
// an identifier, not a secret; access is governed by the Firestore rules).
const API_KEY = 'AIzaSyBmgOGbblRFjLim67GRDRwcSxB2yNDCPHU'
const RUN_QUERY_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery?key=${API_KEY}`

/** ISR window, in seconds, for every blog read. The route files export the
 *  same literal (`export const revalidate = 60`) because Next reads that one
 *  statically. */
export const BLOG_REVALIDATE_SECONDS = 60

/** A published post as the public pages need it. Dates are ISO strings so the
 *  object can cross the server → client boundary (the admin edit island). */
export interface PublicPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  image: string
  readTime: string
  createdAt: string | null
  updatedAt: string | null
  published: boolean
}

export type PostSummary = Omit<PublicPost, 'content'>

// --- Firestore REST value decoding ------------------------------------------

type FsValue = {
  stringValue?: string
  booleanValue?: boolean
  timestampValue?: string
  integerValue?: string
  doubleValue?: number
  nullValue?: null
}
type FsDoc = { name: string; fields?: Record<string, FsValue> }
type RunQueryRow = { document?: FsDoc; readTime?: string }

function str(v: FsValue | undefined): string {
  if (!v) return ''
  if (typeof v.stringValue === 'string') return v.stringValue
  if (typeof v.integerValue === 'string') return v.integerValue
  if (typeof v.doubleValue === 'number') return String(v.doubleValue)
  return ''
}

function time(v: FsValue | undefined): string | null {
  if (!v) return null
  if (typeof v.timestampValue === 'string') return v.timestampValue
  // Older docs may carry a string date.
  if (typeof v.stringValue === 'string' && !Number.isNaN(Date.parse(v.stringValue))) {
    return new Date(v.stringValue).toISOString()
  }
  return null
}

function decode(doc: FsDoc): PublicPost {
  const f = doc.fields ?? {}
  return {
    id: doc.name.split('/').pop() ?? '',
    slug: str(f.slug),
    // Titles typed in the CMS sometimes carry doubled spaces.
    title: str(f.title).replace(/\s+/g, ' ').trim(),
    excerpt: str(f.excerpt).trim(),
    content: str(f.content),
    image: str(f.image),
    readTime: str(f.readTime),
    createdAt: time(f.createdAt),
    updatedAt: time(f.updatedAt),
    published: f.published?.booleanValue === true,
  }
}

const eq = (fieldPath: string, value: FsValue) => ({
  fieldFilter: { field: { fieldPath }, op: 'EQUAL', value },
})

async function runQuery(structuredQuery: object): Promise<PublicPost[]> {
  const res = await fetch(RUN_QUERY_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ structuredQuery }),
    next: { revalidate: BLOG_REVALIDATE_SECONDS, tags: ['blog'] },
  })
  if (!res.ok) {
    throw new Error(`Firestore runQuery failed: ${res.status} ${await res.text().catch(() => '')}`)
  }
  const rows = (await res.json()) as RunQueryRow[]
  return rows.flatMap((r) => (r.document ? [decode(r.document)] : []))
}

const newestFirst = (a: { createdAt: string | null }, b: { createdAt: string | null }) =>
  (b.createdAt ? Date.parse(b.createdAt) : 0) - (a.createdAt ? Date.parse(a.createdAt) : 0)

/**
 * Every published post, newest first, WITHOUT the body (a field mask keeps
 * the listing payload small). Sorted here rather than with `orderBy`, because
 * `published == true` + `orderBy createdAt` would need a composite index that
 * isn't in this repo (Firestore config is console-managed).
 */
export const listPublishedPosts = cache(async (): Promise<PostSummary[]> => {
  const posts = await runQuery({
    from: [{ collectionId: 'blogs' }],
    select: {
      fields: ['slug', 'title', 'excerpt', 'image', 'readTime', 'createdAt', 'updatedAt', 'published'].map(
        (fieldPath) => ({ fieldPath }),
      ),
    },
    where: eq('published', { booleanValue: true }),
  })
  return posts
    .filter((p) => p.slug)
    .sort(newestFirst)
    .map((p) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- drop the (empty, masked-out) body
      const { content, ...summary } = p
      return summary
    })
})

/**
 * ONE published post by slug (not "fetch all, then find"). Two equality
 * filters need no composite index. The CMS regenerates the slug from the
 * title, so an unpublished draft can share a slug with a live post — the
 * `published` filter keeps drafts out, and the newest match wins if two live
 * posts ever collide. `cache` dedupes the call between generateMetadata and
 * the page render.
 */
export const getPublishedPostBySlug = cache(async (slug: string): Promise<PublicPost | null> => {
  const posts = await runQuery({
    from: [{ collectionId: 'blogs' }],
    where: {
      compositeFilter: {
        op: 'AND',
        filters: [eq('published', { booleanValue: true }), eq('slug', { stringValue: slug })],
      },
    },
    limit: 5,
  })
  return posts.sort(newestFirst)[0] ?? null
})

/**
 * The four launch posts used to live at hand-written static routes. They were
 * migrated into Firestore on 2026-07-22 (commit b4caa57), where the CMS gave
 * them title-derived slugs, so the old URLs (still in the public sitemap and
 * in any inbound links) 404'd. Old slug → current slug.
 */
export const LEGACY_SLUGS: Readonly<Record<string, string>> = {
  'history-of-receipts': 'the-history-of-receipts-from-handwritten-notes-to-digital-revolution',
  'hidden-cost-paper-receipts': 'the-hidden-cost-of-paper-receipts-why-your-business-should-care',
  'secret-life-shopping-receipt': 'the-secret-life-of-your-shopping-receipt-what-happens-after-you-toss-it',
  'why-business-owners-hate-printing-receipts':
    'why-every-business-owner-secretly-hates-printing-receipts-but-keeps-doing-it',
}
