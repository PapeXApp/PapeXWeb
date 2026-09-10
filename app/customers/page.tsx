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

import type { Metadata } from 'next'
import { SiteShell } from '@/components/brand/site-shell'
import { CustomerPath } from '@/components/paths/customer'

export const metadata: Metadata = {
  title: 'PapeX for Customers | The last receipt you’ll ever lose',
  description:
    'Tap your phone at checkout and your receipt is saved forever — searchable, shareable and organized. No paper, no app required to receive it.',
  alternates: { canonical: 'https://papex.app/customers' },
  openGraph: {
    type: 'website',
    url: 'https://papex.app/customers',
    title: 'PapeX for Customers | The last receipt you’ll ever lose',
    description:
      'Tap your phone at checkout and your receipt is saved forever — searchable, shareable and organized.',
  },
}

export default function CustomersPage() {
  return (
    <SiteShell path="customer">
      <CustomerPath />
    </SiteShell>
  )
}
