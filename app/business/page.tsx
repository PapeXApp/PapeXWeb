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
    images: [
      {
        url: 'https://papex.app/og-image-v2.png',
        width: 1200,
        height: 630,
        alt: 'PapeX - The Smarter Way to Do Receipts',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PapeX for Business | Modern checkout. Zero paper.',
    description:
      'A free device on your existing POS turns every sale into a digital receipt. No cost, no contract, PCI compliant.',
    images: ['https://papex.app/og-image-v2.png'],
  },
}

export default function BusinessPage() {
  return (
    <SiteShell path="business">
      <BusinessPath />
    </SiteShell>
  )
}
