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

export const metadata: Metadata = {
  title: 'PapeX | Never Lose a Receipt Again',
  description:
    'PapeX turns every checkout into a digital receipt. Choose your path: digital receipts for customers, or free receipt hardware for your business.',
  alternates: { canonical: 'https://papex.app' },
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
