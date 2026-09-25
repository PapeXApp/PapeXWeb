import type { Metadata } from 'next'
// framer-site.css is imported BEFORE globals.css on purpose: its `.framer-site *`
// reset (margin/padding 0) ties with Tailwind utilities on specificity, so the
// later stylesheet wins. Loading Tailwind last lets spacing utilities (px-*,
// mb-*, container...) work inside the framer shell (e.g. blog post pages).
import '@/styles/framer-site.css'
import './globals.css'
// Brand layer for the redesigned site chrome + forked landing. Imported LAST so
// its `.rd`-scoped rules win over Tailwind's base/utilities where they overlap.
// Every token in it is scoped under `.rd` — framer-site.css owns the `:root`
// `--navy`/`--orange`/`--white` names with the legacy palette, so nothing here
// may be hoisted to `:root`.
import '@/styles/papex-brand.css'
import { barlow, gloock, kameron } from './fonts'
import { Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import Script from 'next/script'
import {
  APP_STORE_URL,
  PLAY_STORE_URL,
  SALES_PHONE,
  SOCIAL_LINKS,
  SUPPORT_EMAIL,
} from '@/components/brand/links'

// Mono face for the path homes' section labels and ribbon — exposed as
// --font-geist-mono and consumed through the `--font-label` token in
// styles/papex-brand.css (which keeps a real system fallback stack).
// Deliberately NOT wired to `--font-mono`: that token stays Courier because
// the /customers receipt demo sizes its 32-column body on Courier's advance.
const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-geist-mono',
  display: 'swap',
})

const GA_MEASUREMENT_ID = 'G-QX3WCTWR03'

// Site-wide structured data (Web 2.1 SEO, .claude/plans/2026-09-24-web-2.1-
// seo-keywords.md §5): Organization + WebSite, so Google can tell the
// receipts PapeX apart from the other "papex"es and show the site name.
// Every value comes from components/brand/links.ts, so a phone, email or
// profile change there is the one edit. `sameAs` lists only real, live URLs:
// the two store listings, plus any social profile once its slot in
// SOCIAL_LINKS is filled (empty slots are dropped, never emitted blank).
// Page-specific schema (FAQPage, blog Article) lives with its page.
const ORG_ID = 'https://papex.app/#organization'
const SITE_JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': ORG_ID,
      name: 'PapeX',
      url: 'https://papex.app',
      logo: 'https://papex.app/icons/icon-512.png',
      description: 'PapeX digital receipts: tap your phone at checkout and your receipt opens.',
      email: SUPPORT_EMAIL,
      sameAs: [APP_STORE_URL, PLAY_STORE_URL, ...Object.values(SOCIAL_LINKS).filter(Boolean)],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        telephone: `+1-${SALES_PHONE}`,
        email: SUPPORT_EMAIL,
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://papex.app/#website',
      name: 'PapeX',
      alternateName: 'PapeX digital receipts',
      url: 'https://papex.app',
      publisher: { '@id': ORG_ID },
    },
  ],
  // Escape "<" so no value can ever close the script element.
}).replace(/</g, '\\u003c')

// Site-wide defaults, used by any route without its own metadata. Same voice
// as the per-page titles on /, /business and /customers (keyword first, brand
// as the suffix; title <=60 chars, description <=155). The share image is
// drawn from brand assets by scripts/og/render.mjs (source: scripts/og/og.html).
const DEFAULT_TITLE = 'Your Receipt, One Tap Away | PapeX'
const DEFAULT_DESCRIPTION =
  'Tap your phone at checkout and your receipt opens, no app needed. Select stores add a coupon too. The free PapeX app keeps every receipt and coupon.'
const DEFAULT_OG_IMAGE = {
  url: 'https://papex.app/og-image-v3.png',
  width: 1200,
  height: 630,
  alt: 'The PapeX logo and the words Your receipt, one tap away, beside an iPhone showing a PapeX receipt',
  type: 'image/png',
}

export const metadata: Metadata = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  generator: 'Next.js',
  keywords: [
    'PapeX', 'papex', 'digital receipts', 'paperless receipts', 'electronic receipts', 
    'receipt management', 'financial management', 'eco-friendly receipts', 'green technology',
    'retail technology', 'POS integration', 'expense tracking', 'receipt app', 
    'digital receipt platform', 'paperless transactions', 'receipt digitization',
    'sustainable business', 'receipt automation', 'mobile receipts', 'cloud receipts',
    'receipt storage', 'expense management', 'business receipts', 'retail receipts'
  ],
  authors: [{ name: 'PapeX Team' }, { name: 'Nicolas Courbage' }, { name: 'Michael Khoury' }],
  creator: 'PapeX Team',
  publisher: 'PapeX',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://papex.app',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    siteName: 'PapeX',
    images: [
      DEFAULT_OG_IMAGE,
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE.url],
    creator: '@papex_receipts',
    site: '@papex_receipts'
  },
  alternates: {
    canonical: 'https://papex.app',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: [{ url: '/favicon.ico' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // suppressHydrationWarning: FORK_SKIP_SCRIPT (lib/pathChoice.ts) stamps
    // <html data-fork-skip> during HTML parse, before React hydrates, so the
    // server markup legitimately differs from the client DOM on this one
    // element. Without this, every returning visitor sees a hydration error.
    <html
      lang="en"
      className={`${barlow.variable} ${kameron.variable} ${gloock.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: SITE_JSON_LD }} />
        {/* Google tag (gtag.js) */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </head>
      <body className="font-barlow">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
