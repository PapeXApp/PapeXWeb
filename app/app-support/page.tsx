// app/app-support/page.tsx
//
// Consumer support page for the PapeX iOS app. This is the "Support URL"
// referenced from the App Store listing (App Store Connect > App Information).
// It is intentionally separate from /support, which is the MERCHANT/RDH
// hardware help hub — different audience, different content.
//
// Keep this minimal: an email contact, a few true, verified FAQ items and the
// support request form. Do not add features here that aren't confirmed in the app.
//
// Web 2.1 P7 (Nico, 2026-09-29): moved off FramerPageShell onto the same
// redesign shell as /support (SiteShell + FlowGround + in-flow footer, plane
// watermark, WordReveal/Reveal hero, ScrollWords/ScrollReveal below) and its
// card styles (app/support/support.module.css), with the "Send us a message"
// form (SupportForm -> /api/signup kind "support" -> nico@papex.app).

import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteShell } from '@/components/brand/site-shell'
import { SiteFooter } from '@/components/brand/site-footer'
import { FlowGround } from '@/components/paths/shared/FlowGround'
import { FlowSection } from '@/components/paths/shared/FlowSection'
import { SectionLabel } from '@/components/paths/shared/SectionLabel'
import { Reveal, ScrollReveal, ScrollWords, WordReveal } from '@/components/motion'
import { DEFAULT_OG_IMAGE } from '@/components/blog/image'
import { SupportForm } from '../support/SupportForm'
import styles from '../support/support.module.css'

const OG_ALT =
  'The PapeX logo and the words Your receipt, one tap away, beside an iPhone showing a PapeX receipt'

export const metadata: Metadata = {
  title: 'App help | PapeX',
  description:
    'Help with the PapeX app on iPhone or Android. Email support@papex.app about your account or receipts.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://papex.app/app-support' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://papex.app/app-support',
    siteName: 'PapeX',
    title: 'App help | PapeX',
    description: 'Help with the PapeX app on iPhone or Android. Email support@papex.app about your account or receipts.',
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: OG_ALT }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'App help | PapeX',
    description: 'Help with the PapeX app on iPhone or Android. Email support@papex.app about your account or receipts.',
    images: [DEFAULT_OG_IMAGE],
  },
}

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: 'How do I delete my account?',
    a: 'In the app, go to Settings > Advanced Settings > Delete Account.',
  },
  {
    q: 'How do I forward email receipts into the app?',
    a: "Forward receipt emails to the PapeX email address shown on your Account screen in the app.",
  },
  {
    q: 'Where is the privacy policy?',
    a: (
      <>
        See our{' '}
        <Link
          href="/privacy"
          className={styles.inlineLink}
        >
          Privacy Policy
        </Link>
        .
      </>
    ),
  },
]

/** The disclosure icon (same as /support): the vertical bar lies flat on open. */
function PlusIcon() {
  return (
    <span aria-hidden="true" className={styles.icon}>
      <span className={styles.bar} />
      <span className={`${styles.bar} ${styles.barV}`} />
    </span>
  )
}

export default function AppSupportPage() {
  return (
    <SiteShell path="page">
      <FlowGround initial="light" footer={<SiteFooter inFlow />}>
        <FlowSection ground="light" className={`${styles.section} ${styles.top}`}>
          <div className={styles.wrap}>
            <header className={styles.head}>
              <Reveal>
                <SectionLabel>Shopper support</SectionLabel>
              </Reveal>
              <WordReveal as="h1" className={`rd-display ${styles.title}`}>
                App assistance
              </WordReveal>
              <Reveal as="p" delay={0.15} className={styles.lead}>
                Need help with the PapeX app? Email us at{' '}
                <a href="mailto:support@papex.app" className={styles.inlineLink}>
                  support@papex.app
                </a>{' '}
                or send us a message below, and we&rsquo;ll get back to you.
              </Reveal>
            </header>
          </div>
        </FlowSection>

        <FlowSection ground="light" id="faq" className={styles.section}>
          <div className={styles.wrap}>
            <div className={styles.head}>
              <ScrollWords as="h2" className={styles.h2}>
                FAQ
              </ScrollWords>
            </div>
            <div className={`${styles.stack} ${styles.body}`}>
              {FAQS.map((item) => (
                <ScrollReveal key={item.q}>
                  <details className={`${styles.card} ${styles.details}`}>
                    <summary className={styles.summary}>
                      <span>{item.q}</span>
                      <PlusIcon />
                    </summary>
                    <div className={styles.answer}>
                      <p>{item.a}</p>
                    </div>
                  </details>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </FlowSection>

        <FlowSection ground="light" id="message" className={`${styles.section} ${styles.last}`}>
          <div className={styles.wrap}>
            <div className={styles.head}>
              <ScrollWords as="h2" className={styles.h2}>
                Send us a message
              </ScrollWords>
              <ScrollReveal as="p" className={styles.lead}>
                Tell us what&rsquo;s going on and we&rsquo;ll reply by email.
              </ScrollReveal>
            </div>
            <ScrollReveal className={styles.body}>
              <SupportForm path="/app-support" />
            </ScrollReveal>
          </div>
        </FlowSection>
      </FlowGround>
    </SiteShell>
  )
}
