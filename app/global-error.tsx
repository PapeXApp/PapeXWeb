'use client'

// app/global-error.tsx
//
// Last resort: shown only when the root layout itself fails, so nothing from
// it is available (no fonts, no stylesheets, no nav). Same jammed-printer
// copy and art as app/error.tsx, drawn with inline styles only so it can't
// depend on anything that might be what broke.

import { useEffect } from 'react'
import { JammedReceipt } from '@/components/brand/error-art'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <head>
        <title>The printer&apos;s jammed | PapeX</title>
        <meta name="robots" content="noindex" />
      </head>
      <body style={{ margin: 0, background: '#F5F5F5', color: '#00121D' }}>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '32px 24px',
            boxSizing: 'border-box',
            fontFamily: '"Helvetica Neue", Arial, sans-serif',
            textAlign: 'center',
          }}
        >
          <JammedReceipt />
          <h1
            style={{
              margin: 0,
              fontFamily: 'Georgia, serif',
              fontSize: 'clamp(28px, 5vw, 44px)',
              lineHeight: 1.08,
              fontWeight: 700,
            }}
          >
            The printer&rsquo;s jammed!
          </h1>
          <p style={{ margin: 0, fontSize: '18px', lineHeight: 1.55, color: 'rgba(0,18,29,.72)', maxWidth: '44ch' }}>
            Something broke&hellip;
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginTop: '8px' }}>
            <button
              type="button"
              onClick={reset}
              style={{
                border: 'none',
                borderRadius: '999px',
                background: '#EB7100',
                color: '#00121D',
                padding: '14px 24px',
                minHeight: '44px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            {/* A plain <a>, not next/link: the router may be what failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: '999px',
                border: '1.5px solid rgba(0,18,29,.2)',
                color: '#00121D',
                padding: '12px 24px',
                minHeight: '44px',
                boxSizing: 'border-box',
                fontSize: '15px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Go to the home page
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
