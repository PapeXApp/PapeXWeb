// app/not-found.tsx
//
// The 404 (Phase 4, f-07/f-08/f-09, Nico: "a picture of a receipt that has
// been through the wash, all torn and tarnished"; round 2: it moves, gently —
// sway, stains that breathe, drops falling off the torn edge; still under
// reduced motion). Inside the normal site
// look: SiteShell's nav + skip link, one light <main>, the flat navy footer.
// One <title> (from `metadata`, no hand-written <head>), kept out of search.
// The jammed-printer sibling for real errors is app/error.tsx.

import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteShell } from '@/components/brand/site-shell'
import { SiteFooter } from '@/components/brand/site-footer'
import { MAIN_ID } from '@/components/brand/links'
import { WashedReceipt } from '@/components/brand/error-art'
import styles from '@/components/brand/error-page.module.css'

// `robots` must be set: otherwise the layout's "index, follow" (and its
// googlebot tag) ride along next to the `noindex` Next adds to every 404 —
// the conflicting search settings the old page had. Now every tag says noindex.
export const metadata: Metadata = {
  title: 'This receipt went through the wash | PapeX',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <SiteShell path="page" main={false}>
      <main id={MAIN_ID} tabIndex={-1} className={styles.page} data-nav-theme="light">
        <div className={styles.inner}>
          <WashedReceipt
            className={styles.art}
            motion={{ sway: styles.sway, bubble: styles.bubble, stain: styles.stain, drip: styles.drip }}
          />
          <h1 className={`rd-display ${styles.title}`}>This receipt went through the wash!</h1>
          <p className={styles.lead}>Next time, just PapeX it!</p>
          <div className={styles.actions}>
            <Link href="/" className="rd-btn rd-btn-primary">
              Go to the home page
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </SiteShell>
  )
}
