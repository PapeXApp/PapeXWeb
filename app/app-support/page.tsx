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
// PapeX 1.7.3: this page is also the "Delete account URL" on the Google Play
// Data safety form, so it must tell someone WITHOUT the app how to ask for
// deletion: the visible "Delete your PapeX account" section (#delete-account)
// and the FAQ answer below. Keep both in step with Section 7 ("Deleting your
// account") and Section 13 of app/privacy/page.tsx. 1.7.4: the retention
// wording is FINAL (original emails and usage reports are deleted after a short
// review); publish it only together with the privacy page's final wording.
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

/** Pre-filled subject only: no personal data goes into the link. */
const DELETE_MAILTO = 'mailto:privacy@papex.app?subject=Delete%20my%20PapeX%20account'

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: 'How do I delete my account?',
    a: (
      <>
        In the app, go to Settings &gt; Advanced Settings &gt; Delete Account. If you no longer have the app, email{' '}
        <a href={DELETE_MAILTO} className={styles.inlineLink}>
          privacy@papex.app
        </a>{' '}
        from the email address you use to sign in to PapeX, with &ldquo;Delete my PapeX account&rdquo; in the subject, and
        we will delete your account and the information stored with it as described in our{' '}
        <Link href="/privacy" className={styles.inlineLink}>
          Privacy Policy
        </Link>{' '}
        (Section 7). The steps, including for Apple and Google sign-in, are under{' '}
        <a href="#delete-account" className={styles.inlineLink}>
          Delete your PapeX account
        </a>{' '}
        above.
      </>
    ),
  },
  {
    q: 'I signed up with my phone number. How do I delete my account?',
    a: (
      <>
        In the app, go to Settings &gt; Advanced Settings &gt; Delete Account. If you no longer have the app, email{' '}
        <a href="mailto:privacy@papex.app" className={styles.inlineLink}>
          privacy@papex.app
        </a>{' '}
        with your phone number, and we will text it a one-time code to confirm before we delete your account and the
        information stored with it, as described in our{' '}
        <Link href="/privacy" className={styles.inlineLink}>
          Privacy Policy
        </Link>{' '}
        (Section 7).
      </>
    ),
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

        <FlowSection ground="light" id="delete-account" className={styles.section}>
          <div className={styles.wrap}>
            <div className={styles.head}>
              <ScrollWords as="h2" className={styles.h2}>
                Delete your PapeX account
              </ScrollWords>
              <ScrollReveal as="p" className={styles.lead}>
                You can delete your PapeX account in the app. If you no longer have the app, ask us by email.
              </ScrollReveal>
            </div>
            <div className={`${styles.stack} ${styles.body}`}>
              <ScrollReveal className={`${styles.card} ${styles.cardPad} ${styles.prose}`}>
                <h3 className={styles.doTitle}>In the app</h3>
                <p>
                  Open PapeX and go to Settings &gt; Advanced Settings &gt; Delete Account. The app may ask you to sign in
                  again first. You can use this whether you sign in with an email address and password, with Apple or with
                  Google.
                </p>
              </ScrollReveal>

              <ScrollReveal order={1} className={`${styles.card} ${styles.cardPad} ${styles.prose}`}>
                <h3 className={styles.doTitle}>Without the app, by email</h3>
                <ul className={styles.steps}>
                  <li>
                    <span aria-hidden="true" className={styles.dot} />
                    <span>
                      Email{' '}
                      <a href={DELETE_MAILTO} className={styles.inlineLink}>
                        privacy@papex.app
                      </a>{' '}
                      with &ldquo;Delete my PapeX account&rdquo; in the subject.
                    </span>
                  </li>
                  <li>
                    <span aria-hidden="true" className={styles.dot} />
                    <span>Send it from the email address you use to sign in to PapeX.</span>
                  </li>
                  <li>
                    <span aria-hidden="true" className={styles.dot} />
                    <span>
                      <strong>Signed in with Google?</strong> Send it from the email address of that Google account.
                    </span>
                  </li>
                  <li>
                    <span aria-hidden="true" className={styles.dot} />
                    <span>
                      <strong>Signed in with Apple?</strong> Send it from the email address of your Apple Account. If you
                      chose Hide My Email, Apple gave us a private relay address (it ends in @privaterelay.appleid.com)
                      instead of your real one. In that case, send the email from the address you normally use and write
                      the relay address in your message. Apple shows it in your Apple Account settings, under Sign in with
                      Apple. If you cannot find it, say so in your email and we will help you confirm which account is
                      yours.
                    </span>
                  </li>
                </ul>
                <p>
                  We may reply to ask for more information to confirm that the account is yours. We acknowledge your email
                  within 10 days and complete your request within 45 days, as described in Section 13 of our{' '}
                  <Link href="/privacy" className={styles.inlineLink}>
                    Privacy Policy
                  </Link>
                  . Deleting in the app takes effect at once.
                </p>
              </ScrollReveal>

              <ScrollReveal order={2} className={`${styles.card} ${styles.cardPad} ${styles.prose}`}>
                <h3 className={styles.doTitle}>What is deleted, and what is kept</h3>
                <p>
                  <strong>Deleted at once</strong> when your account is deleted (in the app, or when we carry out your
                  emailed request): your account and the information stored with it in our app database and file storage,
                  including your receipts and their photos, your profile photo, your coupons and coupon photos, cards,
                  Important mail items, settings, partner store sign-ups, feedback, and the records that link your email
                  receipts to their original emails.
                </p>
                <p>
                  <strong>Deleted after a short review</strong> by a member of our team, usually within 1 to 4 days: the
                  original emails of your email receipts, and the usage reports described in our Privacy Policy.
                </p>
                <p>
                  <strong>Kept for a set time:</strong> emails sent to your PapeX email address are deleted automatically 90
                  days after they arrived, and database backups and recovery copies are kept for up to 90 days. We also keep
                  anonymous statistics that do not identify you or the account. The full list is in Section 7 of our{' '}
                  <Link href="/privacy" className={styles.inlineLink}>
                    Privacy Policy
                  </Link>
                  .
                </p>
              </ScrollReveal>
            </div>
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
