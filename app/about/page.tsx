// app/about/page.tsx
//
// About us (Web 2.1, S2). Replaces /contact (now a redirect, next.config.ts)
// per spec §3.4 + §6a Q14: mission, the team grid in three groups, and a
// contact block. Built on the same shell as /blog — SiteShell path="page",
// a FlowGround that starts light, and the in-flow footer — so the page reads
// as one surface with the rest of the redesign rather than a bolted-on
// legacy subpage.
//
// No city/address, no personal emails on cards (LinkedIn only, and only once
// a URL exists), no invented quotes or numbers.

import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { SiteShell } from '@/components/brand/site-shell'
import { FlowGround } from '@/components/paths/shared/FlowGround'
import { FlowSection } from '@/components/paths/shared/FlowSection'
import { SectionLabel } from '@/components/paths/shared/SectionLabel'
import { SiteFooter } from '@/components/brand/site-footer'
import { DEFAULT_OG_IMAGE } from '@/components/blog/image'
import { SALES_PHONE, SALES_PHONE_HREF, SUPPORT_EMAIL } from '@/components/brand/links'
import { teamGroups, initialsFor } from './team'
import styles from './about.module.css'

const TITLE = 'About PapeX | PapeX Digital Receipts'
const DESCRIPTION =
  'Meet the team building PapeX: the tap that gets your receipt to your phone, and the free app that keeps it. Get in touch anytime.'

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
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'PapeX' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@papex_receipts',
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
              <SectionLabel>About</SectionLabel>
              <h1 className={`rd-display ${styles.title}`}>About PapeX</h1>
              <p className={styles.lead}>
                A world where every receipt is useful, and none of them are wasted.
                We&rsquo;re building the tap that gets it to your phone, and the app that
                keeps it.
              </p>
            </header>

            {teamGroups.map((group) => (
              <div key={group.title} className={styles.group}>
                <h2 className={styles.groupTitle}>{group.title}</h2>
                <ul className={styles.grid}>
                  {group.members.map((member) => (
                    <li key={member.name} className={styles.card}>
                      {member.photo ? (
                        <div className={styles.avatarPhoto}>
                          <Image
                            src={member.photo}
                            alt={member.name}
                            fill
                            sizes="92px"
                          />
                        </div>
                      ) : (
                        <div className={styles.avatarInitials} aria-hidden="true">
                          {initialsFor(member.name)}
                        </div>
                      )}
                      <span className={styles.name}>{member.name}</span>
                      <span className={styles.role}>{member.role}</span>
                      {member.linkedin ? (
                        <a
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.linkedin}
                        >
                          LinkedIn
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </FlowSection>

        <FlowSection ground="light" className={styles.contactSection}>
          <div className={styles.contactCard}>
            <h2 className={`rd-display ${styles.contactTitle}`}>Get in touch</h2>
            <p className={styles.contactBody}>
              Questions, feedback, or want PapeX at your checkout? We&rsquo;d love to hear
              from you.
            </p>
            <div className={styles.contactRow}>
              <a href={`mailto:${SUPPORT_EMAIL}`} className={styles.contactLink}>
                {SUPPORT_EMAIL}
              </a>
              <a href={SALES_PHONE_HREF} className={styles.contactLink}>
                {SALES_PHONE}
              </a>
            </div>
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
