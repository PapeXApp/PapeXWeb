// app/support/page.tsx
//
// Merchant support hub for the PapeX Receipt Delivery Hardware (RDH).
// Referenced from the merchant guide pamphlet footer, the hardware label,
// and the footer of merchant-facing documents. A merchant lands here because
// something isn't working or they have a question — get them to the answer fast.
//
// Copy (status light, troubleshooting, do's/don'ts, "If a Customer Asks...")
// is the authoritative merchant-facing wording provided by PapeX. Light
// behaviors also match the RDH firmware state machine
// (Papex_RDH_Firmware/src/state_machine.c).
//
// Web 2.1 P7 (Nico, 2026-09-29): moved off the legacy FramerPageShell onto the
// redesign shell /about and the path homes use (SiteShell path="page" +
// FlowGround + in-flow footer), which brings back the plane watermark and the
// shared motion vocabulary: WordReveal/Reveal in the hero (on screen at load,
// like the path heroes), ScrollWords/ScrollReveal below (the scroll-linked
// pair every static section on the path homes uses). Every coloured box is
// now ONE card: translucent, hairline, tinted only toward its bottom edge
// (support.module.css). Content is unchanged; the "Send us a message" form
// (SupportForm.tsx -> /api/signup kind "support" -> nico@papex.app) is new.

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
  title: 'Help for your PapeX device | PapeX',
  description:
    'Status lights, quick fixes and how to reach us for your PapeX tap device.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://papex.app/support' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://papex.app/support',
    siteName: 'PapeX',
    title: 'Help for your PapeX device | PapeX',
    description: 'Status lights, quick fixes and how to reach us for your PapeX tap device.',
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: OG_ALT }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Help for your PapeX device | PapeX',
    description: 'Status lights, quick fixes and how to reach us for your PapeX tap device.',
    images: [DEFAULT_OG_IMAGE],
  },
}

type Signal = 'normal' | 'attention'

// Source of truth: Papex_RDH_Firmware feat/tcp9100-pilot — include/led.h and
// src/state_machine.c / upload.c / net_wifi.c (green language rebuilt
// 2026-08-18, 3f0ed97). That branch's README table predates it; the code wins.
const LIGHT_ROWS: {
  light: string
  color: 'green' | 'red' | 'off'
  blink?: 'slow' | 'medium' | 'fast'
  meaning: string
  detail: string
  signal: Signal
}[] = [
  {
    light: 'Solid green',
    color: 'green',
    meaning: 'Ready',
    detail: 'Waiting for the next sale. Normal.',
    signal: 'normal',
  },
  {
    light: 'Slow green blink',
    color: 'green',
    blink: 'slow',
    meaning: 'Working on a receipt',
    detail: 'A receipt just printed and is on its way. A few seconds.',
    signal: 'normal',
  },
  {
    light: 'Fast green blink',
    color: 'green',
    blink: 'fast',
    meaning: 'Tap now',
    detail: 'Receipt ready. Customer taps now.',
    signal: 'normal',
  },
  {
    light: 'Solid red',
    color: 'red',
    meaning: 'Connecting',
    detail: 'Joining Wi-Fi, including just after it’s plugged in. Wait 15–30s.',
    signal: 'attention',
  },
  {
    light: 'Slow red blink',
    color: 'red',
    blink: 'slow',
    meaning: 'Sorting itself out',
    detail: 'Needs Wi-Fi setup, is resending a receipt, or is resetting its tap reader. Wait 30s. Still blinking? Call PapeX.',
    signal: 'attention',
  },
  {
    light: 'Medium red blink',
    color: 'red',
    blink: 'medium',
    meaning: 'Not recognized',
    detail: 'PapeX needs to re-activate the device. Call PapeX.',
    signal: 'attention',
  },
  {
    light: 'Fast red blink',
    color: 'red',
    blink: 'fast',
    meaning: 'Error',
    detail: 'Unplug, wait 10s, replug.',
    signal: 'attention',
  },
  {
    light: 'Off',
    color: 'off',
    meaning: 'No power',
    detail: 'A working device is never dark. Check the plug and outlet.',
    signal: 'attention',
  },
]

const SIGNAL_STYLES: Record<Signal, { label: string; className: string }> = {
  normal: { label: 'Normal', className: styles.signalNormal },
  attention: { label: 'Attention', className: styles.signalAttention },
}

// The light plus its rhythm, drawn static (no looping animation anywhere on
// the site): a dot in the light's colour, then a short strip showing the
// on/off pattern over time: one unbroken line = solid, two long dashes =
// slow blink, three mid dashes = medium blink, five short dashes = fast blink. Decorative; the row's own words
// ("Slow green blink" ...) carry the meaning for screen readers.
const RHYTHM: Record<'solid' | 'slow' | 'medium' | 'fast', string | undefined> = {
  solid: undefined,
  slow: '9 5',
  medium: '5 4',
  fast: '2.8 3',
}

function LightDot({
  color,
  blink,
}: {
  color: 'green' | 'red' | 'off'
  blink?: 'slow' | 'medium' | 'fast'
}) {
  const base = 'inline-block h-3 w-3 rounded-full flex-shrink-0'
  if (color === 'off') {
    return (
      <span className="inline-flex w-[46px] flex-shrink-0 items-center" aria-hidden>
        <span className={`${base} border border-gray-400 bg-transparent`} />
      </span>
    )
  }
  const fill = color === 'green' ? 'bg-green-500' : 'bg-red-500'
  const stroke = color === 'green' ? '#22c55e' : '#ef4444'
  const dash = RHYTHM[blink ?? 'solid']
  return (
    <span className="inline-flex w-[46px] flex-shrink-0 items-center gap-[5px]" aria-hidden>
      <span className={`${base} ${fill}`} />
      <svg width="28" height="6" viewBox="0 0 28 6" className="flex-shrink-0">
        <line x1="0" y1="3" x2="28" y2="3" stroke={stroke} strokeWidth="3" strokeDasharray={dash} />
      </svg>
    </span>
  )
}

const TROUBLESHOOTING: { title: string; steps: string[] }[] = [
  {
    title: 'Customer tapped but nothing happened',
    steps: [
      'Make sure their phone’s tap reader (NFC) is on. Most phones have it on already.',
      'Ask the customer to hold their phone flat against the device for 2–3 seconds.',
      'Phone cases can block NFC. Try without the case.',
      'If the receipt card opened but is still blank, it may still be processing. It will show up in a few seconds.',
    ],
  },
  {
    title: 'Customer says the receipt is still loading',
    steps: [
      'This is normal. The receipt is being processed. It typically appears within a few seconds.',
      'If it takes more than 30 seconds, offer to reprint from your POS.',
    ],
  },
  {
    title: 'Light is blinking red',
    steps: [
      'Slow blink: it needs Wi-Fi setup, is resending a receipt, or is resetting its tap reader. Wait 30 seconds. Still blinking? Call PapeX.',
      'Medium blink (about 3 times a second): the device needs to be re-activated. Call PapeX.',
      'Fast blink: power-cycle. Unplug, wait 10 seconds, plug back in.',
      'Still fast after restart? Call PapeX support.',
    ],
  },
  {
    title: 'No light, device unresponsive',
    steps: [
      "Check it's plugged in securely.",
      'Try a different outlet or power cable.',
      'Still nothing? Call PapeX support.',
    ],
  },
  {
    title: 'No paper receipts (paper switched off)',
    steps: [
      'Expected if your store has switched off paper in the POS. Receipts are digital now.',
      'Use your POS reprint function if you need paper for a specific transaction.',
    ],
  },
]

const DOS: string[] = [
  'Keep the device plugged in and powered on at all times',
  'Tell customers they can tap for a digital receipt',
  'Keep your merchant guide near your POS for reference',
  'Call PapeX support if anything seems off',
  'Let PapeX know if you change your Wi-Fi network or password',
  'Contact PapeX before switching POS systems or terminals',
]

const DONTS: string[] = [
  'Don’t unplug or move the device without contacting PapeX',
  'Don’t open, disassemble, or modify the device',
  'Don’t pour liquids on or near the device',
  'Don’t place stickers, tape, or objects on top of the device',
  'Don’t move the device to a different POS station without contacting PapeX',
]

const CUSTOMER_QA: { q: string; a: React.ReactNode }[] = [
  {
    q: '“What’s that thing?”',
    a: 'That’s PapeX. Tap your phone, and your receipt pops up. No paper, no email, no clutter.',
  },
  {
    q: '“How does it work?”',
    a: 'Just tap your phone on it after you pay. A little window pops up on your screen with your receipt. That’s it.',
  },
  {
    q: '“Do I need to download an app?”',
    a: 'Nope, your receipt pops up right away. No app needed. The app simply keeps every receipt and coupon together, connecting your last dollar to your next one.',
  },
  {
    q: '“Is there an app?”',
    a: 'It’s an app that keeps all your receipts and coupons in one place, so finding them takes seconds rather than minutes. It’s available on Apple and Android today!',
  },
  {
    q: '“Is it free?”',
    a: 'Yep, it’s free. It just sends your receipt to your phone instead of printing it.',
  },
  {
    q: '“Is my info safe?”',
    a: 'It only sends you your receipt. It doesn’t collect any personal info or card details.',
  },
  {
    q: '“Can I still get a paper receipt?”',
    a: "Yep. If we still print, you'll get paper too. If we've gone paper-free, I can reprint one from the register.",
  },
  {
    q: '“What if it didn’t work / nothing happened?”',
    a: 'Try holding your phone flat against it for a couple seconds. Sometimes a phone case can block it too. When the green light blinks fast, it’s ready for your tap.',
  },
  {
    q: '“Does it work with my phone?”',
    a: 'Yeah, iPhone and Android both tap. iPhones open the receipt right away; Android phones open it in the browser.',
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
                  Help with your PapeX device
                </WordReveal>
                <Reveal as="p" delay={0.15} className={styles.lead}>
                  Status lights, quick fixes, and how to reach us.
                </Reveal>
              </header>
              <Reveal delay={0.25} className={styles.body}>
                <ContactBlock />
              </Reveal>
            </div>
          </FlowSection>

          <FlowSection ground="light" id="status-light" className={styles.section}>
            <div className={styles.wrap}>
              <SectionHead
                title="Status light"
                lead="Your PapeX device has one status light. Here’s what each state means:"
              />
              <ScrollReveal className={`${styles.card} ${styles.body}`}>
                {/* Phones: each row stacks into a small card (support.module.css), so
                    nothing is cut off at the card edge. Explicit roles keep it a
                    table for screen readers once CSS changes its display. */}
                <div className={styles.tableScroll} data-scroll-x="">
                  <table className={styles.table} role="table">
                    <thead role="rowgroup">
                      <tr role="row">
                        <th scope="col" role="columnheader" className={styles.cap}>Light</th>
                        <th scope="col" role="columnheader" className={styles.cap}>Means</th>
                        <th scope="col" role="columnheader" className={styles.cap}>What to do</th>
                        <th scope="col" role="columnheader" className={styles.cap}>Status</th>
                      </tr>
                    </thead>
                    <tbody role="rowgroup">
                      {LIGHT_ROWS.map((row) => {
                        const sig = SIGNAL_STYLES[row.signal]
                        return (
                          <tr key={`${row.light}-${row.meaning}`} role="row">
                            <td role="cell" className={styles.lightCell}>
                              <span className={styles.lightName}>
                                <LightDot color={row.color} blink={row.blink} />
                                {row.light}
                              </span>
                            </td>
                            <td role="cell" className={styles.meansCell}>{row.meaning}</td>
                            <td role="cell" className={styles.detailCell}>{row.detail}</td>
                            <td role="cell" className={styles.statusCell}>
                              <span className={`${styles.signal} ${sig.className}`}>{sig.label}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </ScrollReveal>
              <ScrollReveal className={`${styles.card} ${styles.cardPad} ${styles.rule}`}>
                <p className={styles.cap}>Quick rule</p>
                <p className={styles.ruleText}>
                  Solid green = ready. Slow green = working. Fast green = tap now. Any red = check the
                  table.
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
                    Your PapeX device only sees the receipt. It never touches card data: nothing stored,
                    processed or sent.
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
