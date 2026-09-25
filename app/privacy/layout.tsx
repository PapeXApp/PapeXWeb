// app/privacy/layout.tsx
//
// page.tsx below is 'use client' (FramerPageShell), so per-route metadata has
// to come from a Server Component sibling. Without this, /privacy inherited
// the root layout's default title/description and its canonical pointed at
// the homepage.

import type { Metadata } from 'next'

const TITLE = 'Privacy Policy | PapeX'
const DESCRIPTION = 'How PapeX collects, uses and protects your information.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: 'https://papex.app/privacy' },
  openGraph: {
    url: 'https://papex.app/privacy',
    title: TITLE,
    description: DESCRIPTION,
  },
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}
