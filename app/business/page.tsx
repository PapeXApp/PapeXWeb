// app/business/page.tsx
//
// The merchant home. A real, linkable, indexable route — a direct visit here
// never shows the fork, and scrolling back up never restores it; only the logo
// or nav "Home" go back (they clear the stored choice).
//
// The hero MUST open on flat #F5F5F5, the same colour as the fork's bottom
// half, for the same continuity reason as /customers. Section content is owned
// by components/paths/business.

import type { Metadata } from 'next'
import { SiteShell } from '@/components/brand/site-shell'
import { BusinessPath } from '@/components/paths/business'

export const metadata: Metadata = {
  title: 'PapeX for Business | Modern checkout. Zero paper.',
  description:
    'A free device on your existing POS turns every sale into a digital receipt. No cost, no contract, PCI compliant, installed the same afternoon.',
  alternates: { canonical: 'https://papex.app/business' },
  openGraph: {
    type: 'website',
    url: 'https://papex.app/business',
    title: 'PapeX for Business | Modern checkout. Zero paper.',
    description:
      'A free device on your existing POS turns every sale into a digital receipt. No cost, no contract, PCI compliant.',
  },
}

export default function BusinessPage() {
  return (
    <SiteShell path="business">
      <BusinessPath />
    </SiteShell>
  )
}
