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

import type { Metadata } from 'next'
import Link from 'next/link'
import { FramerPageShell } from '@/components/framer/framer-page-shell'
import { SALES_PHONE, SALES_PHONE_HREF } from '@/components/brand/links'
import { DEFAULT_OG_IMAGE } from '@/components/blog/image'

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
  normal: { label: 'Normal', className: 'text-green-700' },
  attention: { label: 'Attention', className: 'text-red-600' },
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
    <div className="grid gap-4 sm:grid-cols-2">
      <a
        href="mailto:support@papex.app"
        className="group rounded-2xl border border-[#00121D]/15 bg-white p-6 shadow-sm transition hover:border-[#EB7100] hover:shadow-md"
      >
        <p className="text-[13px] leading-[18px] font-semibold uppercase tracking-wide text-[#00121D]/50">Email us</p>
        <p className="mt-2 text-2xl font-bold text-[#00121D] group-hover:text-[#EB7100] transition">
          support@papex.app
        </p>
      </a>
      <a
        href={SALES_PHONE_HREF}
        className="group rounded-2xl border border-[#00121D]/15 bg-white p-6 shadow-sm transition hover:border-[#EB7100] hover:shadow-md"
      >
        <p className="text-[13px] leading-[18px] font-semibold uppercase tracking-wide text-[#00121D]/50">Call us</p>
        <p className="mt-2 text-2xl font-bold text-[#00121D] group-hover:text-[#EB7100] transition">
          {SALES_PHONE}
        </p>
      </a>
    </div>
  )
}

export default function SupportPage() {
  return (
    <FramerPageShell>
      <div className="container mx-auto py-10 px-4">
        <div className="mx-auto max-w-4xl space-y-12">
          {/* Header */}
          <header className="space-y-3 text-center md:text-left">
            <p className="text-[13px] leading-[18px] font-semibold uppercase tracking-[0.16em] text-[#EB7100]">
              For businesses
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#00121D] leading-tight">
              Help with your PapeX device
            </h1>
            <p className="text-lg text-[#00121D]/70 leading-relaxed">
              Status lights, quick fixes, and how to reach us.
            </p>
          </header>

          {/* Contact — prominent, top of page */}
          <ContactBlock />

          {/* Status Light */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">Status light</h2>
            <p className="text-[#00121D]/70 leading-relaxed">
              Your PapeX device has one status light. Here&rsquo;s what each state means:
            </p>
            <div className="overflow-x-auto rounded-2xl border border-[#00121D]/15">
              <table className="w-full min-w-[38rem] text-sm">
                <thead>
                  <tr className="bg-[#00121D] text-white">
                    <th className="px-4 py-3 text-left font-semibold">Light</th>
                    <th className="px-4 py-3 text-left font-semibold">Means</th>
                    <th className="px-4 py-3 text-left font-semibold">What to do</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {LIGHT_ROWS.map((row, i) => {
                    const sig = SIGNAL_STYLES[row.signal]
                    return (
                      <tr
                        key={`${row.light}-${row.meaning}`}
                        className={i % 2 === 0 ? 'bg-white' : 'bg-[#00121D]/[0.03]'}
                      >
                        <td className="px-4 py-3 border-b border-[#00121D]/10">
                          <span className="flex items-center gap-2 font-medium text-[#00121D]">
                            <LightDot color={row.color} blink={row.blink} />
                            {row.light}
                          </span>
                        </td>
                        <td className="px-4 py-3 border-b border-[#00121D]/10 text-[#00121D]/80">
                          {row.meaning}
                        </td>
                        <td className="px-4 py-3 border-b border-[#00121D]/10 text-[#00121D]/80">
                          {row.detail}
                        </td>
                        <td className="px-4 py-3 border-b border-[#00121D]/10">
                          <span className={`font-semibold ${sig.className}`}>{sig.label}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="rounded-xl border-l-4 border-[#EB7100] bg-[#EB7100]/[0.06] px-5 py-3">
              <p className="text-[#00121D] font-medium">
                <span className="font-semibold">Quick rule:</span> Solid green = ready. Slow green
                = working. Fast green = tap now. Any red = check the table.
              </p>
            </div>
          </section>

          {/* Troubleshooting */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">Troubleshooting</h2>
            <div className="space-y-3">
              {TROUBLESHOOTING.map((item) => (
                <details
                  key={item.title}
                  className="group rounded-2xl border border-[#00121D]/15 bg-white p-5 open:shadow-sm"
                >
                  <summary className="-my-2.5 flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 font-semibold text-[#00121D]">
                    <span>{item.title}</span>
                    <span
                      aria-hidden
                      className="text-[#EB7100] transition-transform group-open:rotate-45 text-xl leading-none"
                    >
                      +
                    </span>
                  </summary>
                  <ul className="mt-4 space-y-2 pl-1">
                    {item.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-[#00121D]/80 leading-relaxed">
                        <span
                          aria-hidden
                          className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#EB7100]"
                        />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </section>

          {/* Do's and Don'ts */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">Do&rsquo;s and don&rsquo;ts</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-green-200 bg-green-50/50 p-6">
                <h3 className="text-lg font-semibold text-green-700">Do</h3>
                <ul className="mt-4 space-y-3">
                  {DOS.map((item) => (
                    <li key={item} className="flex gap-3 text-[#00121D]/85 leading-relaxed">
                      <span aria-hidden className="mt-0.5 font-bold text-green-600">
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
                <h3 className="text-lg font-semibold text-red-600">Don&rsquo;t</h3>
                <ul className="mt-4 space-y-3">
                  {DONTS.map((item) => (
                    <li key={item} className="flex gap-3 text-[#00121D]/85 leading-relaxed">
                      <span aria-hidden className="mt-0.5 font-bold text-red-500">
                        ✕
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* What to tell customers — compact dropdown boxes laid out in a 2-column grid.
              items-start so a collapsed box next to an expanded one keeps its
              own height instead of stretching to match its row neighbour. */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">What to tell customers</h2>
            <p className="text-[#00121D]/70 leading-relaxed">
              Quick answers you can give at the counter.
            </p>
            <div className="grid items-start gap-3 sm:grid-cols-2">
              {CUSTOMER_QA.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-xl border border-[#00121D]/15 bg-white p-4 open:shadow-sm"
                >
                  <summary className="-my-3 flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 text-base font-semibold text-[#00121D] sm:text-sm">
                    <span>{item.q}</span>
                    <span
                      aria-hidden
                      className="flex-shrink-0 text-[#EB7100] transition-transform group-open:rotate-45 text-lg leading-none"
                    >
                      +
                    </span>
                  </summary>
                  <div className="mt-3 text-base text-[#00121D]/85 leading-relaxed sm:text-sm">{item.a}</div>
                </details>
              ))}
            </div>
          </section>

          {/* Never touches card data — navy gradient callout matching the site's subpage CTA.
              NOTE: framer-site.css sets `.framer-site a { color: inherit }`, which
              outranks Tailwind's text colour on links (class+element > class). The
              `!text-[#00121D]` important modifier is required so the button label is
              navy on the orange (o-18) rather than inheriting the body color. */}
          <section className="overflow-hidden rounded-2xl border-t-4 border-[#EB7100] bg-gradient-to-b from-[#00121D] to-[#0a2431] p-8 shadow-md">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#EB7100]">
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
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white">Never touches card data</h2>
                <p className="mt-2 leading-relaxed text-white/75">
                  Your PapeX device only sees the receipt. It never touches card data: nothing
                  stored, processed or sent.
                </p>
                <Link
                  href="/pci"
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#EB7100] px-6 py-3 text-sm font-semibold !text-[#00121D] shadow-sm transition hover:bg-[#cc6300]"
                >
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
              </div>
            </div>
          </section>

          {/* Contact block repeated. This is page content inside <main>, not a
              document landmark — SiteFooter (FramerPageShell) is the page's
              real <footer>, so this stays a <section> to keep exactly one
              footer landmark. */}
          <section className="border-t border-[#00121D]/10 pt-8 space-y-4">
            <h2 className="text-lg font-semibold text-[#00121D]">Contact PapeX</h2>
            <ContactBlock />
          </section>
        </div>
      </div>
    </FramerPageShell>
  )
}
