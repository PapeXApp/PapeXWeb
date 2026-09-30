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
// Tap a card to see a short bio. The page stays a Server Component (it owns
// `metadata`), so the toggle is one delegated click listener installed by
// next/script rather than React state: each card has a real full-bleed
// <button aria-expanded aria-controls> UNDER its content, the listener flips
// aria-expanded, and CSS swaps the faces off that attribute. The listener
// lives on `document`, so it keeps working after client-side navigation
// back to /about (a new DOM, same listener). The email/LinkedIn chips sit
// above the button and outside it, so they never toggle the card. Both faces
// share one grid cell, so the card is always sized to the taller face and
// nothing moves when it flips. Reduced motion = instant swap (CSS).

import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Script from 'next/script'
import { SiteShell } from '@/components/brand/site-shell'
import { FlowGround } from '@/components/paths/shared/FlowGround'
import { FlowSection } from '@/components/paths/shared/FlowSection'
import { SectionLabel } from '@/components/paths/shared/SectionLabel'
import { SiteFooter } from '@/components/brand/site-footer'
import { DEFAULT_OG_IMAGE } from '@/components/blog/image'
import { teamGroups, initialsFor } from './team'
import styles from './about.module.css'

/** Toggles a team card's bio. Idempotent: installs one listener per page load. */
const BIO_TOGGLE_SCRIPT = `(function(){
if (window.__papexBioToggle) return; window.__papexBioToggle = true;
document.addEventListener('click', function (e) {
  var t = e.target;
  var b = t && t.closest ? t.closest('[data-bio-toggle]') : null;
  if (!b) return;
  b.setAttribute('aria-expanded', b.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
});
})();`

/** "Nicolas Courbage" -> "bio-nicolas-courbage" (unique: names are unique). */
function bioId(name: string): string {
  return `bio-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

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
                    <li key={member.name} className={styles.card}>
                      {member.bio ? (
                        <button
                          type="button"
                          className={styles.toggle}
                          aria-expanded="false"
                          aria-controls={bioId(member.name)}
                          data-bio-toggle=""
                        >
                          <span className={styles.srOnly}>About {member.name}</span>
                        </button>
                      ) : null}
                      <div className={styles.stack}>
                        <div className={styles.front}>
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
                        </div>
                        {member.bio ? (
                          <p id={bioId(member.name)} className={styles.back}>
                            {member.bio}
                          </p>
                        ) : null}
                      </div>
                      {member.bio ? <span className={styles.hint} aria-hidden="true" /> : null}
                      {member.email || member.linkedin ? (
                        <div className={styles.links}>
                          {member.email ? (
                            <a
                              href={`mailto:${member.email}`}
                              className={styles.chip}
                              aria-label={`Email ${member.name} at ${member.email}`}
                              title={member.email}
                            >
                              Email
                            </a>
                          ) : null}
                          {member.linkedin ? (
                            <a
                              href={member.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.chip}
                              aria-label={`LinkedIn profile of ${member.name} (opens in a new tab)`}
                            >
                              LinkedIn
                            </a>
                          ) : null}
                        </div>
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
      <Script
        id="about-bio-toggle"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: BIO_TOGGLE_SCRIPT }}
      />
    </SiteShell>
  )
}
