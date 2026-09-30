// app/about/page.tsx
//
// About us (Web 2.1, S2). Replaces /contact (now a redirect, next.config.ts)
// per spec §3.4 + §6a Q14: mission, the team grid in three groups, and a
// contact block. Built on the same shell as /blog — SiteShell path="page",
// a FlowGround that starts light, and the in-flow footer — so the page reads
// as one surface with the rest of the redesign rather than a bolted-on
// legacy subpage.
//
// No city/address, no invented quotes or numbers. Contact chips: work email
// for the three co-founders only (Nico, 2026-09-29) and LinkedIn only once a
// URL exists — see team.ts.
//
// Tap a card to see a short bio: each card is the client component
// `TeamCard` (./TeamCard.tsx); this page stays a Server Component because it
// owns `metadata`.

import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteShell } from '@/components/brand/site-shell'
import { FlowGround } from '@/components/paths/shared/FlowGround'
import { FlowSection } from '@/components/paths/shared/FlowSection'
import { SectionLabel } from '@/components/paths/shared/SectionLabel'
import { SiteFooter } from '@/components/brand/site-footer'
import { DEFAULT_OG_IMAGE } from '@/components/blog/image'
import { teamGroups } from './team'
import { TeamCard } from './TeamCard'
import styles from './about.module.css'

const OG_ALT =
  'The PapeX logo and the words Your receipt, one tap away, beside an iPhone showing a PapeX receipt'
const TITLE = 'About PapeX | Digital Receipts, One Tap at Checkout'
const DESCRIPTION =
  'Meet the team building PapeX: the tap that gets your receipt to your phone, and the app that keeps it. Get in touch anytime.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: 'https://papex.app/about' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://papex.app/about',
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

export default function AboutPage() {
  return (
    <SiteShell path="page">
      <FlowGround initial="light" footer={<SiteFooter inFlow />}>
        <FlowSection ground="light" className={styles.top}>
          <div className={styles.wrap}>
            <header className={styles.head}>
              <SectionLabel>Our team</SectionLabel>
              <h1 className={`rd-display ${styles.title}`}>About PapeX</h1>
              <p className={styles.lead}>
                Receipts should be a tool, not trash. So we&rsquo;re making them easy to
                save, useful to keep, and simple to find.
              </p>
            </header>

            {teamGroups.map((group) => (
              <div key={group.title} className={styles.group}>
                <h2 className={styles.groupTitle}>{group.title}</h2>
                <ul className={styles.grid}>
                  {group.members.map((member) => (
                    <TeamCard key={member.name} member={member} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </FlowSection>

        <FlowSection ground="light" className={styles.contactSection}>
          <div className={styles.contactCard}>
            <h2 className={`rd-display ${styles.contactTitle}`}>Want PapeX at your checkout?</h2>
            <p className={styles.contactBody}>We&rsquo;ll show you how it works.</p>
            <div className={styles.contactCta}>
              <Link href="/business#demo" className="rd-btn rd-btn-primary">
                Request a demo
              </Link>
            </div>
          </div>
        </FlowSection>
      </FlowGround>
    </SiteShell>
  )
}
