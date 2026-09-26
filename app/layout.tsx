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

// No-JS visibility (Web 2.1 P5, attribute-based since P7). Scroll reveals,
// pinned scenes, flip cards and the FAQ accordion all start in a state only JS
// can advance, so with JS off their headings and paragraphs stayed invisible
// to no-JS visitors and crawlers. This rule lives inside <noscript>, so
// browsers with JS never parse it: first paint, hydration and every reveal are
// untouched. Every selector is a data attribute (never a CSS-module class, whose
// generated name differs between build and dev and changes on rename):
//   1. Reveal / WordReveal words / ChildStagger children (components/motion,
//      data-reveal / data-reveal-group): forced to their settled, visible
//      state. !important is what beats the inline hidden style.
//   2. The /business pinned scroll scenes (§02 intro, §03 story, §05 setup)
//      ship BOTH a runway and a static version and pick by CSS; with no JS the
//      runway can never play, so show the static version, exactly as reduced
//      motion does (data-nojs="runway" / "static").
//   3. /customers §02 How it works (customer/HowItWorks.tsx) has no separate
//      static version: its runway collapses to the stage's own height, the
//      stage unpins, all three steps show at full ink with full rails, and the
//      phone stays on step 1 (the tap). The tap/scroll cue and page dots, which
//      describe an interaction that can't happen, are dropped (data-nojs="walk-*").
//   4. /customers problem flip cards (customer/FlipCards.tsx): the 3D flip is
//      flattened and the answer face (stat, caption, source) is stacked under
//      the question face; the "Tap to reveal" footer and the empty dock strip
//      are dropped (data-nojs="flip-*").
//   5. The FAQ accordion (shared/Faq.tsx) can't be opened without JS, so its
//      answers are shown open and the +/− icon wears its open state
//      (data-nojs="faq-*").
const NO_JS_REVEAL_CSS = [
  '[data-reveal],[data-reveal-group]>*{opacity:1!important;transform:none!important;filter:none!important}',
  // ScrollReveal/ScrollWords (P3-R1) are CSS scroll-driven, so they would still
  // run with JS off; the brief is "no JS = the still, complete page".
  '.papex-rv,.papex-rw-word{animation:none!important}',
  '[data-reveal="mask"]{clip-path:none!important}',
  // 2. business scenes
  '[data-nojs="runway"]{display:none!important}',
  '[data-nojs="static"]{display:block!important}',
  // 3. customer How it works
  '[data-nojs="walk-runway"]{height:auto!important;margin-bottom:0!important}',
  '[data-nojs="walk-stage"]{position:relative!important;height:auto!important;padding-block:var(--section-pad)!important}',
  '[data-nojs="walk-step"]{opacity:1!important;transform:none!important}',
  '[data-nojs="walk-fill"]{transform:none!important}',
  '[data-nojs="walk-dots"],[data-nojs="walk-cue"]{display:none!important}',
  // 4. flip cards
  '[data-nojs="flip-card"]{height:auto!important;perspective:none!important}',
  '[data-nojs="flip-inner"]{display:grid!important;gap:12px;height:auto!important;transform:none!important;transform-style:flat!important}',
  '[data-nojs="flip-face"],[data-nojs="flip-back"]{position:relative!important;inset:auto!important;transform:none!important;backface-visibility:visible!important;-webkit-backface-visibility:visible!important}',
  '[data-nojs="flip-face"]{height:var(--fc-height)}',
  '[data-nojs="flip-result"]>*{opacity:1!important;transform:none!important;animation:none!important}',
  '[data-nojs="flip-link"]{pointer-events:auto!important}',
  '[data-nojs="flip-hint"],[data-nojs="flip-slot"]{display:none!important}',
  // 5. FAQ
  '[data-nojs="faq-panel"]{grid-template-rows:1fr!important}',
  '[data-nojs="faq-clip"]{visibility:visible!important}',
  '[data-nojs="faq-answer"]{opacity:1!important;transform:none!important}',
  '[data-nojs="faq-icon"]{transform:rotate(180deg)!important;background-color:var(--orange)!important;border-color:var(--orange)!important}',
  '[data-nojs="faq-bar"],[data-nojs="faq-bar-v"]{background:var(--navy)!important}',
  '[data-nojs="faq-bar-v"]{transform:none!important}',
].join('')

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
        {/* JS off only: see NO_JS_REVEAL_CSS above. */}
        <noscript>
          <style dangerouslySetInnerHTML={{ __html: NO_JS_REVEAL_CSS }} />
        </noscript>
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
