// app/page.tsx
//
// `/` is now the fork: a full-viewport split that forces one deliberate choice
// between the customer and business homepages (docs/design/forked-landing/
// README.md, "Screen 1"). The real content lives at /customers and /business.
//
// The previous landing page (components/framer/framer-landing-page.tsx) is
// intentionally left in the repo, untouched and unused, until the redesign
// ships.

import type { Metadata } from 'next'
import { SiteShell } from '@/components/brand/site-shell'
import { ForkGate } from '@/components/brand/fork-gate'
import { FORK_SKIP_SCRIPT } from '@/lib/pathChoice'

// Keyword first, brand as the suffix. openGraph + twitter are spelled out in
// full here: Next replaces (does not deep-merge) the layout's openGraph and
// twitter objects per page, so leaving either out would drop the image or
// fall back to the layout's old title.
// Title and description are Nico's approved Web 2.1 SEO copy (2026-09-24,
// .claude/plans/2026-09-24-web-2.1-headline-psychology.md §4 + brainstorm
// §8c). The same text is used for OpenGraph and Twitter so a shared link
// matches the search result. Title ≤60 chars, description ≤155.
const TITLE = 'Digital Receipts, One Tap at Checkout | PapeX'
const DESCRIPTION =
  'Tap your phone at checkout and your receipt opens. Shoppers keep every receipt in the free PapeX app. Stores get a free digital receipt device.'
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
  alternates: { canonical: 'https://papex.app' },
  openGraph: {
    type: 'website',
    url: 'https://papex.app',
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

export default function Home() {
  return (
    <SiteShell path="fork">
      {/* Must render before the fork markup — see components/brand/fork-gate.tsx */}
      <script dangerouslySetInnerHTML={{ __html: FORK_SKIP_SCRIPT }} />
      <ForkGate />
    </SiteShell>
  )
}
