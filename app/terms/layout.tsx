// app/terms/layout.tsx
//
// page.tsx below is 'use client' (FramerPageShell), so per-route metadata has
// to come from a Server Component sibling. Without this, /terms inherited the
// root layout's default title/description and its canonical pointed at the
// homepage.

import type { Metadata } from 'next'

const TITLE = 'Terms of Service | PapeX'
const DESCRIPTION = 'The terms for using PapeX and papex.app.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: 'https://papex.app/terms' },
  openGraph: {
    url: 'https://papex.app/terms',
    title: TITLE,
    description: DESCRIPTION,
  },
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
