// app/support/page.tsx
//
// Merchant support hub for the PapeX sticker (RDS, Receipt Delivery Sticker:
// one laminated NFC sticker per register). Linked from the instructions that
// ship with the stickers and from merchant-facing documents. A merchant lands
// here because something isn't working or they have a question — get them to
// the answer fast.
//
// Web 2.4 (2026-10-21): rewritten for the sticker. The old RDH box copy
// (status light, Wi-Fi, power, plug, printer) is gone. Facts used, the same
// as the /business copy rules in components/paths/business/content.ts:
// receipts come from the store's POS through an integration (with most POS
// systems, an API key from the store and from the POS); we mail one laminated
// sticker per register with simple instructions; setup takes about 5 minutes;
// iPhone opens an App Clip, Android a web page, no download; PapeX never
// touches card data. Never name a POS, never say the app is free (the sticker,
// setup and the tapped receipt are).
//
// Web 2.1 P7 (Nico, 2026-09-29): moved off the legacy FramerPageShell onto the
// redesign shell /about and the path homes use (SiteShell path="page" +
// FlowGround + in-flow footer), which brings back the plane watermark and the
// shared motion vocabulary: WordReveal/Reveal in the hero (on screen at load,
// like the path heroes), ScrollWords/ScrollReveal below (the scroll-linked
// pair every static section on the path homes uses). Every coloured box is
// ONE card: translucent, hairline, tinted only toward its bottom edge
// (support.module.css). The "Send us a message" form (SupportForm.tsx ->
// /api/signup kind "support" -> nico@papex.app) sits under the FAQ.

import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteShell } from '@/components/brand/site-shell'
import { SiteFooter } from '@/components/brand/site-footer'
import { FlowGround } from '@/components/paths/shared/FlowGround'
import { FlowSection } from '@/components/paths/shared/FlowSection'
import { SectionLabel } from '@/components/paths/shared/SectionLabel'
import { Reveal, ScrollReveal, ScrollWords, WordReveal } from '@/components/motion'
import { SALES_PHONE, SALES_PHONE_HREF } from '@/components/brand/links'
import { DEFAULT_OG_IMAGE } from '@/components/blog/image'
import { SupportForm } from './SupportForm'
import styles from './support.module.css'

const OG_ALT =
  'The PapeX logo and the words Your receipt, one tap away, beside an iPhone showing a PapeX receipt'

export const metadata: Metadata = {
  title: 'Help with the PapeX sticker | PapeX',
  description:
    'How the PapeX sticker works, quick fixes, what to tell customers and how to reach us.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://papex.app/support' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://papex.app/support',
    siteName: 'PapeX',
    title: 'Help with the PapeX sticker | PapeX',
    description: 'How the PapeX sticker works, quick fixes, what to tell customers and how to reach us.',
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: OG_ALT }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Help with the PapeX sticker | PapeX',
    description: 'How the PapeX sticker works, quick fixes, what to tell customers and how to reach us.',
    images: [DEFAULT_OG_IMAGE],
  },
}

// What happens on a sale, in the order it happens. Plain words: a merchant
// reads this at the counter.
const HOW_IT_WORKS: { title: string; text: string }[] = [
  {
    title: 'Your POS sends the receipt',
    text: 'When a sale is done, your POS sends the receipt to PapeX through the connection we set up. Nothing to do at the register.',
  },
  {
    title: 'Your customer taps',
    text: 'They hold their phone on the PapeX sticker. On iPhone the receipt opens right away; on Android it opens in the browser. No download.',
  },
  {
    title: 'You see the sale',
    text: 'The same receipt shows up on your PapeX dashboard, live from the first receipt.',
  },
]

const TROUBLESHOOTING: { title: string; steps: string[] }[] = [
  {
    title: 'Customer tapped but nothing happened',
    steps: [
      'Make sure their screen is on and their phone’s tap reader (NFC) is on. Most phones have it on already.',
      'Ask them to hold the top of their phone flat on the PapeX sticker for 2–3 seconds.',
      'Thick phone cases and card wallets can block the tap. Try without the case.',
    ],
  },
  {
    title: 'The receipt opened but is blank or still loading',
    steps: [
      'This is normal for a few seconds. The receipt is on its way from your POS.',
      'Have customers tap once the sale is finished.',
      'Still empty after 30 seconds? Ask them to tap again, or reprint from your POS.',
    ],
  },
  {
    title: 'Taps work, but no receipts come through',
    steps: [
      'Your POS connection to PapeX may need a look, for example after a change to your POS settings or API keys.',
      'Call PapeX and we’ll check it with you.',
    ],
  },
  {
    title: 'A sticker is damaged, peeling or missing',
    steps: [
      'Call or email PapeX and we’ll mail you a new one.',
      'Tell us which register it’s for.',
    ],
  },
  {
    title: 'No paper receipts (paper switched off)',
    steps: [
      'Expected if your store has switched off paper in the POS. Receipts are digital now.',
      'Use your POS reprint function if you need paper for a specific sale.',
    ],
  },
]

const DOS: string[] = [
  'Keep the PapeX sticker at the register, where customers can see it',
  'Tell customers they can tap for their receipt',
  'Wipe the sticker with a soft cloth if it gets dirty',
  'Keep the instructions that came with your stickers',
  'Call PapeX if anything seems off',
  'Tell PapeX before you add a register, switch POS systems or change your POS API keys',
]

const DONTS: string[] = [
  'Don’t cover the sticker with other stickers, tape or signs',
  'Don’t cut, fold or peel apart the sticker',
  'Don’t move a sticker to a different register without telling PapeX',
  'Don’t delete the API key PapeX uses in your POS without telling us',
]

const CUSTOMER_QA: { q: string; a: React.ReactNode }[] = [
  {
    q: '“What’s that sticker?”',
    a: 'That’s PapeX. Tap your phone on it, and your receipt pops up. No paper, no email, no clutter.',
  },
  {
    q: '“How does it work?”',
    a: 'Just tap your phone on the sticker after you pay. Your receipt pops up on your screen. That’s it.',
  },
  {
    q: '“Do I need to download an app?”',
    a: 'Nope, your receipt pops up right away. No app needed. The app simply keeps every receipt and coupon together, connecting your last dollar to your next one.',
  },
  {
    q: '“Is there an app?”',
    a: 'Yes. It keeps all your receipts and coupons in one place, so finding them takes seconds rather than minutes. It’s on the App Store and Google Play.',
  },
  {
    q: '“Does it cost anything?”',
    a: 'No. Getting your receipt with a tap is free.',
  },
  {
    q: '“Is my info safe?”',
    a: 'A tap sends you only your receipt. No name, email or phone number, and like a paper receipt it shows just the last 4 digits of your card.',
  },
  {
    q: '“Can I still get a paper receipt?”',
    a: "Yep. If we still print, you'll get paper too. If we've gone paper-free, I can reprint one from the register.",
  },
  {
    q: '“What if it didn’t work / nothing happened?”',
    a: 'Hold the top of your phone flat on the sticker for a couple of seconds, with your screen on. A thick case can block it too.',
  },
  {
    q: '“Does it work with my phone?”',
    a: 'Yes, iPhone and Android. iPhones open the receipt right away; Android phones open it in the browser.',
  },
]

function ContactBlock() {
  return (
    <div className={styles.contactGrid}>
      <a href="mailto:support@papex.app" className={`${styles.card} ${styles.cardPad} ${styles.contact}`}>
        <span className={styles.cap}>Email us</span>
        <span className={styles.contactValue}>support@papex.app</span>
      </a>
      <a href={SALES_PHONE_HREF} className={`${styles.card} ${styles.cardPad} ${styles.contact}`}>
        <span className={styles.cap}>Call us</span>
        <span className={styles.contactValue}>{SALES_PHONE}</span>
      </a>
    </div>
  )
}

/** The disclosure icon: two bars, the vertical one lies flat on open. */
function PlusIcon() {
  return (
    <span aria-hidden="true" className={styles.icon}>
      <span className={styles.bar} />
      <span className={`${styles.bar} ${styles.barV}`} />
    </span>
  )
}

/** Section heading + optional lead. No eyebrow: like /about, only the hero
 *  carries a SectionLabel, so no new label copy was invented. */
function SectionHead({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className={styles.head}>
      <ScrollWords as="h2" className={styles.h2}>
        {title}
      </ScrollWords>
      {lead ? (
        <ScrollReveal as="p" className={styles.lead}>
          {lead}
        </ScrollReveal>
      ) : null}
    </div>
  )
}

export default function SupportPage() {
  return (
    <SiteShell path="page">
      <FlowGround initial="light" footer={<SiteFooter inFlow />}>
          {/* Hero: on screen at load, so the timed reveals (as on the path
              heroes); the contact cards stay at the top of the page. */}
          <FlowSection ground="light" className={`${styles.section} ${styles.top}`}>
            <div className={styles.wrap}>
              <header className={styles.head}>
                <Reveal>
                  <SectionLabel>For businesses</SectionLabel>
                </Reveal>
                <WordReveal as="h1" className={`rd-display ${styles.title}`}>
                  Help with your PapeX sticker
                </WordReveal>
                <Reveal as="p" delay={0.15} className={styles.lead}>
                  How it works, quick fixes, and how to reach us.
                </Reveal>
              </header>
              <Reveal delay={0.25} className={styles.body}>
                <ContactBlock />
              </Reveal>
            </div>
          </FlowSection>

          <FlowSection ground="light" id="how-it-works" className={styles.section}>
            <div className={styles.wrap}>
              <SectionHead
                title="How it works"
                lead="There’s one PapeX sticker at each register. Nothing to plug in, charge or connect."
              />
              <ol className={`${styles.howGrid} ${styles.body}`}>
                {HOW_IT_WORKS.map((step, i) => (
                  <ScrollReveal as="li" key={step.title} order={i} className={`${styles.card} ${styles.cardPad}`}>
                    <p className={`${styles.cap} ${styles.howNum}`}>Step {i + 1}</p>
                    <h3 className={styles.howTitle}>{step.title}</h3>
                    <p className={styles.howText}>{step.text}</p>
                  </ScrollReveal>
                ))}
              </ol>
              <ScrollReveal className={`${styles.card} ${styles.cardPad} ${styles.rule}`}>
                <p className={styles.cap}>Quick rule</p>
                <p className={styles.ruleText}>
                  Finish the sale, then the customer holds their phone flat on the sticker.
                </p>
              </ScrollReveal>
            </div>
          </FlowSection>

          <FlowSection ground="light" id="troubleshooting" className={styles.section}>
            <div className={styles.wrap}>
              <SectionHead title="Troubleshooting" />
              <div className={`${styles.stack} ${styles.body}`}>
                {TROUBLESHOOTING.map((item) => (
                  <ScrollReveal key={item.title}>
                    <details className={`${styles.card} ${styles.details}`}>
                      <summary className={styles.summary}>
                        <span>{item.title}</span>
                        <PlusIcon />
                      </summary>
                      <div className={styles.answer}>
                        <ul className={styles.steps}>
                          {item.steps.map((step, i) => (
                            <li key={i}>
                              <span aria-hidden="true" className={styles.dot} />
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </details>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </FlowSection>

          <FlowSection ground="light" id="dos-and-donts" className={styles.section}>
            <div className={styles.wrap}>
              <SectionHead title="Do’s and don’ts" />
              <div className={`${styles.doGrid} ${styles.body}`}>
                <ScrollReveal className={`${styles.card} ${styles.cardPad}`}>
                  <h3 className={styles.doTitle}>
                    <span aria-hidden="true" className={`${styles.mark} ${styles.markDo}`}>✓</span>
                    Do
                  </h3>
                  <ul className={styles.doList}>
                    {DOS.map((item) => (
                      <li key={item}>
                        <span aria-hidden="true" className={`${styles.mark} ${styles.markDo}`}>✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </ScrollReveal>
                <ScrollReveal order={1} className={`${styles.card} ${styles.cardPad}`}>
                  <h3 className={styles.doTitle}>
                    <span aria-hidden="true" className={`${styles.mark} ${styles.markDont}`}>✕</span>
                    Don’t
                  </h3>
                  <ul className={styles.doList}>
                    {DONTS.map((item) => (
                      <li key={item}>
                        <span aria-hidden="true" className={`${styles.mark} ${styles.markDont}`}>✕</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </ScrollReveal>
              </div>
            </div>
          </FlowSection>

          <FlowSection ground="light" id="what-to-tell-customers" className={styles.section}>
            <div className={styles.wrap}>
              <SectionHead
                title="What to tell customers"
                lead="Quick answers you can give at the counter."
              />
              {/* items-start: a closed card next to an open one keeps its own height. */}
              <div className={`${styles.qaGrid} ${styles.body}`}>
                {CUSTOMER_QA.map((item, i) => (
                  <ScrollReveal key={item.q} order={i % 2}>
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

          {/* The support request form, under the FAQ. Serves shoppers and
              store owners alike (the topic select says which). */}
          <FlowSection ground="light" id="message" className={styles.section}>
            <div className={styles.wrap}>
              <SectionHead
                title="Send us a message"
                lead="Tell us what's going on and we'll reply by email."
              />
              <ScrollReveal className={styles.body}>
                <SupportForm path="/support" />
              </ScrollReveal>
            </div>
          </FlowSection>

          {/* Navy from here: the ground itself turns (the old navy callout
              box is gone), then runs straight into the footer. */}
          <FlowSection ground="navy" id="card-data" className={styles.section}>
            <div className={styles.wrap}>
              <div className={styles.cardData}>
                <ScrollReveal className={styles.shield}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </ScrollReveal>
                <div>
                  <ScrollWords as="h2" className={styles.h2}>
                    Never touches card data
                  </ScrollWords>
                  <ScrollReveal as="p" className={styles.lead}>
                    The POS handles the card. PapeX only gets the receipt, and never stores, processes
                    or transmits card data.
                  </ScrollReveal>
                  <ScrollReveal className={styles.cta}>
                    <Link href="/pci" className="rd-btn rd-btn-primary">
                      How we handle card data
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </Link>
                  </ScrollReveal>
                </div>
              </div>
            </div>
          </FlowSection>

          {/* Contact block repeated. Page content inside <main>, not a
              landmark: SiteFooter (in the FlowGround footer slot) is the
              page's one real <footer>. */}
          <FlowSection ground="navy" id="contact" className={`${styles.section} ${styles.last}`}>
            <div className={styles.wrap}>
              <SectionHead title="Contact PapeX" />
              <ScrollReveal className={styles.body}>
                <ContactBlock />
              </ScrollReveal>
            </div>
          </FlowSection>
      </FlowGround>
    </SiteShell>
  )
}
