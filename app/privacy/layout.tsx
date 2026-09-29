// app/privacy/layout.tsx
//
// page.tsx below is 'use client' (FramerPageShell), so per-route metadata has
// to come from a Server Component sibling. Without this, /privacy inherited
// the root layout's default title/description and its canonical pointed at
// the homepage.

import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/components/blog/image'

const OG_ALT =
  'The PapeX logo and the words Your receipt, one tap away, beside an iPhone showing a PapeX receipt'

const TITLE = 'Privacy Policy | PapeX'
const DESCRIPTION = 'How PapeX collects, uses and protects your information.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: 'https://papex.app/privacy' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://papex.app/privacy',
    siteName: 'PapeX',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: OG_ALT }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}
