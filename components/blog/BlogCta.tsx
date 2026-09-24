// components/blog/BlogCta.tsx
//
// The blog's closing call to action — one for each audience the site serves.
// Replaces the old "Join our newsletter" / "Join our waitlist" → /waitlist
// (the waitlist is being retired, spec §3.4).

import Link from 'next/link'
import { FlowSection } from '@/components/paths/shared/FlowSection'
import { GetAppButton } from './GetAppButton'
import styles from './blog.module.css'

export function BlogCta() {
  return (
    <FlowSection ground="light" className={styles.ctaSection}>
      <div className={styles.ctaCard}>
        <h2 className={`rd-display ${styles.ctaTitle}`}>See PapeX in action.</h2>
        <p className={styles.ctaBody}>
          Shopping? Get the PapeX app and keep every receipt in one place. Running a store? We&rsquo;ll
          show you how PapeX works at your checkout.
        </p>
        <div className={styles.ctaRow}>
          <GetAppButton className="rd-btn rd-btn-primary" />
          <Link href="/business#demo" className="rd-btn rd-btn-outline">
            Request a demo
          </Link>
        </div>
      </div>
    </FlowSection>
  )
}
