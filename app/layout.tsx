import type { Metadata } from 'next'
import './globals.css'
import { barlow, kameron } from './fonts'
import { Analytics } from '@vercel/analytics/react'

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
  verification: {
    google: 'your-google-verification-code-here',
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
      {
        url: 'https://papex.app/favlogo.png',
        width: 800,
        height: 600,
        alt: 'PapeX Logo'
      }
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
      { url: '/favlogo.png', sizes: 'any' },
      { url: '/favlogo.png', type: 'image/png' }
    ],
    shortcut: [{ url: '/favlogo.png' }],
    apple: [{ url: '/favlogo.png' }],
    other: [
      {
        rel: 'apple-touch-icon',
        url: '/favlogo.png',
      },
    ],
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${barlow.variable} ${kameron.variable}`}>
      <head>
        <link rel="icon" href="/favlogo.png" sizes="any" />
        <link rel="icon" href="/favlogo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favlogo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="font-barlow">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
