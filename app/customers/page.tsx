// app/customers/page.tsx
//
// The customer home. A real, linkable, indexable route — a direct visit here
// never shows the fork, and scrolling back up never restores it; only the logo
// or nav "Home" go back (they clear the stored choice).
//
// The hero MUST open on flat #F5F5F5, the same colour as the fork's bottom
// half (which leads here): that colour continuity is what makes the 620ms
// commit read as one surface growing rather than a page swap. The first paint
// comes from FlowGround's `initial="light"` in components/paths/customer,
// which owns the section content.
//
// Metadata (Web 2.1): the true positioning — no app needed to GET a receipt,
// the free app KEEPS it; no "saved forever" on tap alone.

import type { Metadata } from 'next'
import { SiteShell } from '@/components/brand/site-shell'
import { CustomerPath } from '@/components/paths/customer'

// "Works on iPhone and Android" is true of both halves: tapping (App Clip on
// iPhone, the browser on Android) and the app itself (lib/storeLinks.ts has
// both live listings, and the hero's Download button sends Android to Play).
// Title and description are Nico's approved Web 2.1 SEO copy (2026-09-24,
// .claude/plans/2026-09-24-web-2.1-headline-psychology.md §4 + brainstorm
// §8c). The same text is used for OpenGraph and Twitter so a shared link
// matches the search result. Title ≤60 chars, description ≤155.
const TITLE = 'Digital Receipts App: Keep Every Receipt | PapeX'
const DESCRIPTION =
  'Tap your phone at checkout and your receipt opens, no app needed. The free PapeX app keeps every receipt searchable. Works on iPhone and Android.'
const OG_IMAGE = {
  url: 'https://papex.app/og-image-v3.png',
  width: 1200,
  height: 630,
  alt: 'The PapeX logo and the words Your receipt, one tap away, beside an iPhone showing a PapeX receipt',
  type: 'image/png',
}

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: 'https://papex.app/customers' },
  openGraph: {
    type: 'website',
    url: 'https://papex.app/customers',
    siteName: 'PapeX',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
}

export default function CustomersPage() {
  return (
    <SiteShell path="customer">
      <CustomerPath />
    </SiteShell>
  )
}
