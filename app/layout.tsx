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
import { Analytics } from '@vercel/analytics/react'
import Script from 'next/script'

const GA_MEASUREMENT_ID = 'G-QX3WCTWR03'

export const metadata: Metadata = {
  title: 'PapeX | Digital Receipts Revolutionized - Paperless Receipt Solutions',
  description: 'PapeX revolutionizes digital receipts by eliminating paper waste and streamlining financial management. Our platform integrates with POS systems to deliver instant digital receipts, saving businesses money while helping the environment. Join the paperless revolution with PapeX.',
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
    title: 'PapeX | Digital Receipts Revolutionized - Paperless Receipt Solutions',
    description: 'PapeX revolutionizes digital receipts by eliminating paper waste and streamlining financial management. Our platform integrates with POS systems to deliver instant digital receipts, saving businesses money while helping the environment.',
    siteName: 'PapeX',
    images: [
      {
        url: 'https://papex.app/og-image-v2.png',
        width: 1200,
        height: 630,
        alt: 'PapeX - The Smarter Way to Do Receipts',
        type: 'image/png'
      },
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PapeX | Digital Receipts Revolutionized - Paperless Receipt Solutions',
    description: 'PapeX revolutionizes digital receipts by eliminating paper waste and streamlining financial management. Our platform integrates with POS systems to deliver instant digital receipts.',
    images: ['https://papex.app/og-image-v2.png'],
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
      className={`${barlow.variable} ${kameron.variable} ${gloock.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/favicon-32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" sizes="180x180" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
