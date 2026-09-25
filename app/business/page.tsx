// app/business/page.tsx
//
// The merchant home. A real, linkable, indexable route — a direct visit here
// never shows the fork, and scrolling back up never restores it; only the logo
// or nav "Home" go back (they clear the stored choice).
//
// The hero MUST open on flat #00121D, the same colour as the fork's top half
// (which leads here), for the same continuity reason as /customers. The first
// paint comes from FlowGround's `initial="navy"` in components/paths/business,
// which owns the section content.
//
// Metadata follows the Web 2.1 CLAIM RULES in components/paths/business/
// content.ts.

import type { Metadata } from 'next'
import { SiteShell } from '@/components/brand/site-shell'
import { BusinessPath } from '@/components/paths/business'

// "Tap to Retain" leads the title (Nico, §8c: "we aren't just receipts
// anymore"); the description carries the search phrases "digital receipts
// for small business" and "NFC digital receipts". No "coupons" anywhere
// here: merchant-sent coupons are still "Coming soon" (copy gate rule 2).
// Title and description are Nico's approved Web 2.1 SEO copy (2026-09-24,
// .claude/plans/2026-09-24-web-2.1-headline-psychology.md §4 + brainstorm
// §8c). The same text is used for OpenGraph and Twitter so a shared link
// matches the search result. Title ≤60 chars, description ≤155.
const TITLE = 'Tap to Retain | Free Digital Receipts for Business | PapeX'
const DESCRIPTION =
  'NFC digital receipts for small business: customers tap their phone, you get a dashboard of every receipt. Free device, installed free in about 15 minutes.'
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
  alternates: { canonical: 'https://papex.app/business' },
  openGraph: {
    type: 'website',
    url: 'https://papex.app/business',
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

export default function BusinessPage() {
  return (
    <SiteShell path="business">
      <BusinessPath />
    </SiteShell>
  )
}
