'use client'

// app/error.tsx
//
// The error page for anything that throws while rendering (Phase 4, f-07…
// f-09): the printer's jammed (round 2 copy), inside the normal site look (nav,
// light <main>, footer). The 404's washed receipt is app/not-found.tsx; the
// last-resort app/global-error.tsx (when the root layout itself fails) shows
// the same jammed art with no stylesheet.
//
// An error boundary can't export `metadata`, so the one tab title is set
// here once the page is up.

import { useEffect } from 'react'
import Link from 'next/link'
import { SiteShell } from '@/components/brand/site-shell'
import { SiteFooter } from '@/components/brand/site-footer'
import { MAIN_ID } from '@/components/brand/links'
import { JammedReceipt } from '@/components/brand/error-art'
import styles from '@/components/brand/error-page.module.css'

const JAMMED_TITLE = 'The printer\'s jammed | PapeX'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  useEffect(() => {
    document.title = JAMMED_TITLE
  }, [])

  return (
    <SiteShell path="page" main={false}>
      <main id={MAIN_ID} tabIndex={-1} className={styles.page} data-nav-theme="light">
        <div className={styles.inner}>
          <JammedReceipt
            className={styles.art}
            motion={{ led: styles.led, shudder: styles.shudder }}
          />
          <h1 className={`rd-display ${styles.title}`}>The printer&rsquo;s jammed!</h1>
          <p className={styles.lead}>Something broke&hellip;</p>
          <div className={styles.actions}>
            <button type="button" className="rd-btn rd-btn-primary" onClick={reset}>
              Try again
            </button>
            <Link href="/" className="rd-btn rd-btn-outline">
              Go to the home page
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </SiteShell>
  )
}
